import type { Entity, System } from "@/packages/games/engine";
import { angleBetween } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { Body } from "../domain/components";
import { boostStrength } from "../utils/boosts";
import { levelOf, PRISM_SPREAD } from "./boosts";
import { fire, leadDirection } from "./combat";
import { VoyageContext } from "./context";
import { faultSeverity } from "./faults";
import { shipOf } from "./queries";

// How hard a missile turns towards what it hunts (radians a second).
const MISSILE_TURN = 2.4;
// How much louder a shot makes the ship to anything listening.
const SHOT_NOISE = 0.35;
// With nothing to fire at, the gun looks again this often (seconds) rather than every step.
const LOOK_EVERY = 0.1;

// Guns and what they fire. Every gun cools down; shots run out of range; missiles turn after their quarry. The
// ship's gun aims itself, leading its target: what the player locked onto first, then anyone coming for the
// ship, then rocks headed for a world, then a rock about to hit the ship. It never fires on the peaceful or the
// neutral unless told to. Glitching sensors throw its aim wide. Every shot warms the hull and is heard.
export class WeaponSystem implements System<VoyageContext> {
  public readonly name = "weapons";
  private restFor = 0;

  public reset(): void {
    this.restFor = 0;
  }

  public update(context: VoyageContext, dt: number): void {
    const { world, state } = context;

    this.restFor = Math.max(0, this.restFor - dt);

    world.stores.weapon.values.forEach((weapon) => {
      weapon.cooldown = Math.max(0, weapon.cooldown - dt);
    });

    world.stores.projectile.entities.forEach((entity, index) => {
      const shot = world.stores.projectile.values[index];

      shot.ttl -= dt;

      if (shot.ttl <= 0) {
        world.despawn(entity);
      } else if (shot.kind === "missile" && shot.target !== null) {
        this.home(context, entity, shot.target, dt);
      }
    });

    const parts = shipOf(context);
    const weapon = world.stores.weapon.get(state.ship);

    // Cloaked, the gun holds its fire, or it would give the ship away.
    const isCloaked = levelOf(context, "cloak") > 0;

    if (!parts || !weapon || state.status !== "flying" || state.capture || state.phase === "lost" || weapon.cooldown > 0 || this.restFor > 0 || isCloaked) {
      return;
    }

    const target = this.choose(context, parts.body, weapon.range);

    if (target === null) {
      this.restFor = LOOK_EVERY;
    }
    const at = target !== null ? world.stores.body.get(target) : undefined;
    const aim = at ? leadDirection(parts.body, at, weapon.speed) : null;

    if (target !== null && aim) {
      // Glitching sensors throw the aim off.
      const wide = (context.random() - 0.5) * 2 * context.config.faults.aim * faultSeverity(state, "glitch");
      const angle = Math.atan2(aim.y, aim.x) + wide;

      fire(context, state.ship, weapon, Math.cos(angle), Math.sin(angle), "ship", target);

      // A prism splits each shot into more, fanned out either side; a wingman fires alongside, so the gun is ready
      // again sooner.
      const prism = levelOf(context, "prism");
      const wingman = levelOf(context, "wingman");

      for (let split = 1; prism > 0 && split <= boostStrength("prism", prism); split += 1) {
        const side = (split % 2 === 0 ? 1 : -1) * Math.ceil(split / 2) * PRISM_SPREAD;

        fire(context, state.ship, weapon, Math.cos(angle + side), Math.sin(angle + side), "ship", target);
      }

      weapon.cooldown /= wingman > 0 ? boostStrength("wingman", wingman) : 1;
      parts.ship.temperatureC += weapon.heat;
      state.signature += SHOT_NOISE;
    }
  }

  // What to fire at, in one pass over each kind and without making any arrays: the lock first, then the nearest
  // one coming for the ship, the nearest rock headed for a world, the nearest rock about to hit the ship.
  private choose(context: VoyageContext, ship: Body, range: number): Entity | null {
    const { world, state, config } = context;
    const distanceTo = (entity: Entity) => {
      const at = world.stores.body.get(entity);

      return at ? Math.hypot(at.x - ship.x, at.y - ship.y) : Infinity;
    };

    if (state.lockedTarget !== null && world.isAlive(state.lockedTarget) && distanceTo(state.lockedTarget) <= range * 1.1) {
      return state.lockedTarget;
    }

    if (!state.autoFire) {
      return null;
    }

    let best: Entity | null = null;
    let nearest = range;
    const aliens = world.stores.alien;

    for (let index = 0; index < aliens.size; index += 1) {
      const alien = aliens.values[index];
      const distance = alien.threat > 0 && alien.mode !== "evade" ? distanceTo(aliens.entities[index]) : Infinity;

      if (distance <= nearest) {
        best = aliens.entities[index];
        nearest = distance;
      }
    }

    if (best !== null) {
      return best;
    }

    for (const rock of world.stores.impactor.entities) {
      const distance = distanceTo(rock);

      if (distance <= nearest) {
        best = rock;
        nearest = distance;
      }
    }

    if (best !== null) {
      return best;
    }

    for (const hazard of world.stores.hazard.entities) {
      const rock = world.stores.body.get(hazard);
      const distance = rock ? Math.hypot(rock.x - ship.x, rock.y - ship.y) : Infinity;

      if (!rock || distance > nearest) {
        continue;
      }

      // When the rock passes closest, and how close.
      const px = rock.x - ship.x;
      const py = rock.y - ship.y;
      const vx = rock.vx - ship.vx;
      const vy = rock.vy - ship.vy;
      const speed = vx * vx + vy * vy;
      const time = speed > 0 ? -(px * vx + py * vy) / speed : Infinity;

      if (time > 0 && time < config.arms.threatSeconds && Math.hypot(px + vx * time, py + vy * time) < rock.radius + ship.radius + 0.15) {
        best = hazard;
        nearest = distance;
      }
    }

    return best;
  }

  private home({ world }: VoyageContext, entity: Entity, target: Entity, dt: number): void {
    const shot = world.stores.body.get(entity);
    const quarry = world.stores.body.get(target);

    if (!shot || !quarry) {
      return;
    }

    const speed = Math.hypot(shot.vx, shot.vy);
    const heading = Math.atan2(shot.vy, shot.vx);
    const wanted = Math.atan2(quarry.y - shot.y, quarry.x - shot.x);
    const next = heading + clamp(angleBetween(heading, wanted), -MISSILE_TURN * dt, MISSILE_TURN * dt);

    shot.vx = Math.cos(next) * speed;
    shot.vy = Math.sin(next) * speed;
  }
}

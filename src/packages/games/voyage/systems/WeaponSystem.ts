import type { Entity, System } from "@/packages/games/engine";

import { Body } from "../domain/components";
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

    if (!parts || !weapon || state.status !== "flying" || state.capture || state.phase === "lost" || weapon.cooldown > 0 || this.restFor > 0) {
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
    const turn = Math.atan2(Math.sin(wanted - heading), Math.cos(wanted - heading));
    const next = heading + Math.max(-MISSILE_TURN * dt, Math.min(MISSILE_TURN * dt, turn));

    shot.vx = Math.cos(next) * speed;
    shot.vy = Math.sin(next) * speed;
  }
}

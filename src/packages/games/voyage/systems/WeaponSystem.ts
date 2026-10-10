import type { Entity, System } from "@/packages/games/engine";
import { angleBetween } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { Weapon } from "../domain/components";
import { boostStrength } from "../utils/boosts";
import { levelOf, PRISM_SPREAD } from "./boosts";
import { chooseTarget, fire, leadDirection } from "./combat";
import { VoyageContext } from "./context";
import { faultSeverity } from "./faults";
import { shipOf } from "./queries";

// How hard a missile turns towards what it hunts (radians a second).
const MISSILE_TURN = 2.4;
// How much louder a shot makes the ship to anything listening.
const SHOT_NOISE = 0.35;
// With nothing to fire at, the gun looks again this often (seconds) rather than every step.
const LOOK_EVERY = 0.1;
// With its rounds gone (on normal), the main gun fires a weak backup shot: this share of its damage, this share of
// its rate, a little slower; and says it is dry no more often than this (seconds).
const BACKUP = { damage: 0.3, rate: 0.5, speed: 0.8 };
const DRY_EVERY = 3;

// Guns and what they fire. Every gun cools down; shots run out of range; missiles turn after their quarry. The
// ship's gun aims itself, leading its target: what the player locked onto first, then anyone coming for the
// ship, then rocks headed for a world, then a rock about to hit the ship. It never fires on the peaceful or the
// neutral unless told to. Glitching sensors throw its aim wide. Every shot warms the hull and is heard.
export class WeaponSystem implements System<VoyageContext> {
  public readonly name = "weapons";
  private restFor = 0;
  private dryFor = 0;
  // The backup gun, made once and changed in place.
  private readonly backup: Weapon = { kind: "backup", damage: 0, rate: 1, range: 1, speed: 1, heat: 0, cooldown: 0 };

  public reset(): void {
    this.restFor = 0;
    this.dryFor = 0;
  }

  public update(context: VoyageContext, dt: number): void {
    const { world, state } = context;

    this.restFor = Math.max(0, this.restFor - dt);
    this.dryFor = Math.max(0, this.dryFor - dt);

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

    // Aimed by hand, the gun fires only while the pilot fires, where they point; otherwise it chooses for itself.
    const isManual = state.aimMode === "manual";
    const { input } = context;
    const target = isManual ? state.lockedTarget : chooseTarget(context, parts.body, weapon.range, state.autoFire);
    const at = target !== null ? world.stores.body.get(target) : undefined;
    const lead = !isManual && at ? leadDirection(parts.body, at, weapon.speed) : null;
    const aim = isManual ? (input.fire && input.target ? { x: input.target.x - parts.body.x, y: input.target.y - parts.body.y } : null) : lead;

    if (!aim) {
      this.restFor = isManual ? 0 : LOOK_EVERY;

      return;
    }

    // Out of rounds: a weak backup shot on normal, nothing on hard.
    const hasRounds = state.ammo.rounds > 0;

    if (!hasRounds && state.difficulty === "hard") {
      this.sayDry(context);

      return;
    }

    const gun = hasRounds ? weapon : this.backupOf(weapon);

    if (!hasRounds) {
      this.sayDry(context);
    }

    // Glitching sensors throw the aim off.
    const wide = (context.random() - 0.5) * 2 * context.config.faults.aim * faultSeverity(state, "glitch");
    const angle = Math.atan2(aim.y, aim.x) + wide;

    if (hasRounds) {
      state.ammo.rounds -= 1;
    }

    fire(context, state.ship, gun, Math.cos(angle), Math.sin(angle), "ship", target, { ammo: hasRounds ? "rounds" : null });

    if (!hasRounds) {
      weapon.cooldown = gun.cooldown;
    }

    // A prism splits each shot into more, fanned out either side; a wingman fires alongside, so the gun is ready
    // again sooner.
    const prism = levelOf(context, "prism");
    const wingman = levelOf(context, "wingman");

    for (let split = 1; prism > 0 && split <= boostStrength("prism", prism); split += 1) {
      const side = (split % 2 === 0 ? 1 : -1) * Math.ceil(split / 2) * PRISM_SPREAD;

      fire(context, state.ship, gun, Math.cos(angle + side), Math.sin(angle + side), "ship", target);
      weapon.cooldown = gun.cooldown;
    }

    weapon.cooldown /= wingman > 0 ? boostStrength("wingman", wingman) : 1;
    parts.ship.temperatureC += weapon.heat;
    state.signature += SHOT_NOISE;
  }

  // The backup gun for the main gun as it stands: weaker, slower, a little shorter.
  private backupOf(weapon: Weapon): Weapon {
    const { backup } = this;

    backup.damage = weapon.damage * BACKUP.damage;
    backup.rate = weapon.rate * BACKUP.rate;
    backup.range = weapon.range;
    backup.speed = weapon.speed * BACKUP.speed;
    backup.heat = weapon.heat * 0.5;

    return backup;
  }

  private sayDry({ events }: VoyageContext): void {
    if (this.dryFor === 0) {
      this.dryFor = DRY_EVERY;
      events.emit("dry", { kind: "primary" });
    }
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

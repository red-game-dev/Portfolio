import type { Entity } from "@/packages/games/engine";

import { Body, Weapon } from "../domain/components";
import { AmmoType } from "../gear/domain/gear";
import { VoyageContext } from "./context";
import { damageImpactor } from "./impacts";
import { leaveWreck } from "./salvage";

// How large a shot is, and how long past its range it may fly.
const SHOT_RADIUS = 0.025;
const SHOT_SPARE = 1.15;
// Damage that wakes an alien's whole pack, within this distance of it.
const PACK_REACH = 7;
// Kills count towards a streak while each falls within this long of the last (ms), and a streak is called out
// every this many kills.
const STREAK_MS = 6000;
const STREAK_CALL = 5;

// What else a shot carries: the ammunition it took and the piece that fired it, for the ship's own; a burst's
// radius on impact; for a mine when it arms and how near something must come; and a share of its gun's damage.
export interface ShotOptions {
  ammo?: AmmoType | null;
  source?: string | null;
  blast?: number;
  armAt?: number;
  trigger?: number;
  damageScale?: number;
  // How much of the shooter's own velocity the shot keeps (all of it unless said): a mine keeps little, so it is
  // left behind where it was dropped.
  inherit?: number;
}

// The direction to fire at `speed` from `from` (moving at its velocity) to meet `to` (moving at its own): the
// smallest positive time t for which the shot and the target are in the same place, from |p + v t| = s t. Null
// when the target outruns the shot.
export const leadDirection = (from: Body, to: Body, speed: number): { x: number; y: number; time: number } | null => {
  const px = to.x - from.x;
  const py = to.y - from.y;
  const vx = to.vx - from.vx;
  const vy = to.vy - from.vy;
  const a = vx * vx + vy * vy - speed * speed;
  const b = 2 * (px * vx + py * vy);
  const c = px * px + py * py;
  let time: number;

  if (Math.abs(a) < 1e-9) {
    time = b < 0 ? -c / b : -1;
  } else {
    const disc = b * b - 4 * a * c;

    if (disc < 0) {
      return null;
    }

    const root = Math.sqrt(disc);
    const early = (-b - root) / (2 * a);
    const late = (-b + root) / (2 * a);

    time = early > 0 && late > 0 ? Math.min(early, late) : Math.max(early, late);
  }

  if (!(time > 0)) {
    return null;
  }

  const x = px + vx * time;
  const y = py + vy * time;
  const length = Math.hypot(x, y) || 1;

  return { x: x / length, y: y / length, time };
};

// A shot leaves the shooter's muzzle with the shooter's own velocity added, for its side, and the gun goes on
// cooldown. The ship's shots may land a critical hit, by the chance its fittings give.
export const fire = (context: VoyageContext, shooter: Entity, weapon: Weapon, dx: number, dy: number, team: "ship" | "aliens", target: Entity | null,
  options: ShotOptions = {}): void => {
  const { world, events, config, random } = context;
  const body = world.stores.body.get(shooter);

  if (!body) {
    return;
  }

  const shot = world.spawn();
  const x = body.x + dx * (body.radius + SHOT_RADIUS * 2);
  const y = body.y + dy * (body.radius + SHOT_RADIUS * 2);
  const isCrit = team === "ship" && config.arms.crit > 0 && random() < config.arms.crit;
  const damage = weapon.damage * (options.damageScale ?? 1) * (isCrit ? 2 : 1);
  const ttl = weapon.speed > 0 ? (weapon.range / weapon.speed) * SHOT_SPARE : weapon.range;
  const inherit = options.inherit ?? 1;

  world.stores.body.set(shot, {
    x, y, vx: body.vx * inherit + dx * weapon.speed, vy: body.vy * inherit + dy * weapon.speed, prevX: x, prevY: y, radius: SHOT_RADIUS, mass: 0.001,
  });
  world.stores.projectile.set(shot, {
    owner: shooter,
    team,
    kind: weapon.kind,
    damage,
    ttl,
    target,
    source: options.source ?? null,
    isCrit,
    blast: options.blast,
    armAt: options.armAt,
    trigger: options.trigger,
  });
  weapon.cooldown = 1 / weapon.rate;
  events.emit("fired", { x, y, angle: Math.atan2(dy, dx), kind: weapon.kind, team, ammo: options.ammo ?? null, source: options.source ?? null });
};

// A burst at a point: everything hostile within its radius is struck, harder the nearer the middle, rocks shattered
// or chipped; the peaceful are spared unless they are the lock.
export const explode = (context: VoyageContext, x: number, y: number, radius: number, damage: number, source: string | null): void => {
  const { world, state, events } = context;

  events.emit("blast", { x, y, radius });
  world.stores.alien.entities.forEach((entity, index) => {
    const alien = world.stores.alien.values[index];
    const at = world.stores.body.get(entity);
    const disposition = alien.faction >= 0 ? state.cosmos?.factions[alien.faction]?.disposition : "peaceful";
    const distance = at ? Math.hypot(at.x - x, at.y - y) - at.radius : Infinity;

    if (distance < radius && (disposition !== "peaceful" || state.lockedTarget === entity)) {
      damageAlien(context, entity, damage * (1 - 0.5 * Math.max(0, distance) / radius), source);
    }
  });
  world.stores.impactor.entities.forEach((entity) => {
    const at = world.stores.body.get(entity);

    if (at && Math.hypot(at.x - x, at.y - y) - at.radius < radius) {
      damageImpactor(context, entity, damage, (at.x - x) * 0.5, (at.y - y) * 0.5);
    }
  });
  world.stores.hazard.entities.forEach((entity) => {
    const at = world.stores.body.get(entity);

    if (at && Math.hypot(at.x - x, at.y - y) - at.radius < radius) {
      events.emit("shattered", { x: at.x, y: at.y, radius: at.radius });
      world.despawn(entity);
    }
  });
};

// What to fire at, in one pass over each kind and without making any arrays: the lock first, then (while the guns
// choose for themselves) the nearest one coming for the ship, the nearest rock headed for a world, the nearest rock
// about to hit the ship.
export const chooseTarget = (context: VoyageContext, ship: Body, range: number, isChoosing: boolean): Entity | null => {
  const { world, state, config } = context;
  const distanceTo = (entity: Entity) => {
    const at = world.stores.body.get(entity);

    return at ? Math.hypot(at.x - ship.x, at.y - ship.y) : Infinity;
  };

  if (state.lockedTarget !== null && world.isAlive(state.lockedTarget) && distanceTo(state.lockedTarget) <= range * 1.1) {
    return state.lockedTarget;
  }

  if (!isChoosing) {
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
};

// A kill by the ship counts towards a streak while each falls soon after the last; every fifth is called out.
const countKill = (context: VoyageContext): void => {
  const { state, events } = context;
  const { streak } = state;

  streak.count = state.elapsedMs - streak.lastAt <= STREAK_MS ? streak.count + 1 : 1;
  streak.lastAt = state.elapsedMs;
  streak.best = Math.max(streak.best, streak.count);

  if (streak.count % STREAK_CALL === 0) {
    events.emit("streak", { count: streak.count });
  }
};

// Damage to someone who lives here: shields first, then hull. It raises their threat towards the player, and a
// pack fights together: everyone of the same faction near them is roused too. A peaceful one only flees. The
// fallen leave their hulk drifting, with whatever they carried.
export const damageAlien = (context: VoyageContext, entity: Entity, amount: number, source: string | null = null, isCrit = false): void => {
  const { world, state, events, config } = context;
  const alien = world.stores.alien.get(entity);
  const health = world.stores.health.get(entity);
  const body = world.stores.body.get(entity);

  if (!alien || !health || !body || alien.mode === "evade") {
    return;
  }

  const toShields = Math.min(health.shields, amount);

  health.shields -= toShields;
  health.hull -= amount - toShields;
  health.rechargeIn = config.ship.shieldDelayMs;
  alien.threat += amount;
  events.emit("struck", { x: body.x, y: body.y, toShields, amount, entity, isCrit, source });

  const faction = state.cosmos?.factions[alien.faction];

  if (faction?.disposition !== "peaceful") {
    world.stores.alien.entities.forEach((other, index) => {
      const mate = world.stores.alien.values[index];
      const at = world.stores.body.get(other);

      if (other !== entity && mate.faction === alien.faction && mate.mode !== "evade" && at && Math.hypot(at.x - body.x, at.y - body.y) < PACK_REACH) {
        mate.threat = Math.max(mate.threat, 1);
      }
    });
  }

  if (health.hull <= 0) {
    events.emit("downed", { x: body.x, y: body.y, role: alien.role, faction: alien.faction, level: alien.level, source });
    countKill(context);
    leaveWreck(context, "alien", {
      x: body.x,
      y: body.y,
      vx: body.vx * 0.4,
      vy: body.vy * 0.4,
      radius: body.radius,
      faction: alien.faction,
      level: alien.level,
      isBoss: alien.role === "boss",
    });

    if (alien.role === "boss") {
      state.bossFallen = true;
      state.boss = null;
      events.emit("boss", { name: faction?.name ?? "", isFallen: true });

      // A boss leaves a chest too, sure to hold something worth the fight.
      const chest = world.spawn();

      world.stores.body.set(chest, { x: body.x, y: body.y, vx: body.vx * 0.2, vy: body.vy * 0.2, prevX: body.x, prevY: body.y, radius: 0.09, mass: 0.05 });
      world.stores.pickup.set(chest, { kind: "chest" });
    }

    if (state.lockedTarget === entity) {
      state.lockedTarget = null;
    }

    world.despawn(entity);
  }
};

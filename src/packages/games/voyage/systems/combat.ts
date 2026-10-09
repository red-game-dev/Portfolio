import type { Entity } from "@/packages/games/engine";

import { Body, Weapon } from "../domain/components";
import { VoyageContext } from "./context";
import { leaveWreck } from "./salvage";

// How large a shot is, and how long past its range it may fly.
const SHOT_RADIUS = 0.025;
const SHOT_SPARE = 1.15;
// Damage that wakes an alien's whole pack, within this distance of it.
const PACK_REACH = 7;

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
// cooldown.
export const fire = (context: VoyageContext, shooter: Entity, weapon: Weapon, dx: number, dy: number, team: "ship" | "aliens", target: Entity | null): void => {
  const { world, events } = context;
  const body = world.stores.body.get(shooter);

  if (!body) {
    return;
  }

  const shot = world.spawn();
  const x = body.x + dx * (body.radius + SHOT_RADIUS * 2);
  const y = body.y + dy * (body.radius + SHOT_RADIUS * 2);

  world.stores.body.set(shot, { x, y, vx: body.vx + dx * weapon.speed, vy: body.vy + dy * weapon.speed, prevX: x, prevY: y, radius: SHOT_RADIUS, mass: 0.001 });
  world.stores.projectile.set(shot, { owner: shooter, team, kind: weapon.kind, damage: weapon.damage, ttl: (weapon.range / weapon.speed) * SHOT_SPARE, target });
  weapon.cooldown = 1 / weapon.rate;
  events.emit("fired", { x, y, angle: Math.atan2(dy, dx), kind: weapon.kind, team });
};

// Damage to someone who lives here: shields first, then hull. It raises their threat towards the player, and a
// pack fights together: everyone of the same faction near them is roused too. A peaceful one only flees. The
// fallen leave their hulk drifting, with whatever they carried.
export const damageAlien = (context: VoyageContext, entity: Entity, amount: number): void => {
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
  events.emit("struck", { x: body.x, y: body.y, toShields });

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
    events.emit("downed", { x: body.x, y: body.y, role: alien.role, faction: alien.faction, level: alien.level });
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
    }

    if (state.lockedTarget === entity) {
      state.lockedTarget = null;
    }

    world.despawn(entity);
  }
};

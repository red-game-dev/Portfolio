import type { Entity } from "@/packages/games/engine";

import { Body, Weapon } from "../domain/components";
import { MINE_ARM, MINE_LIFE } from "../gear/config/weapons";
import { ArmedWeapon } from "../gear/domain/gear";
import { chooseTarget, damageAlien, fire, leadDirection } from "./combat";
import { VoyageContext } from "./context";
import { damageImpactor } from "./impacts";
import { shipOf } from "./queries";

// What came of pressing a weapon's key: it fired, it is cooling down, there is no ammunition, nothing to aim at
// (a homing missile with nothing to home on), or it cannot fire now (lost, falling, coming down, not on the bar).
export type FireOutcome = "fired" | "cooling" | "empty" | "noTarget" | "unable";

// A gun shaped for `fire` from a weapon on the bar, made once and changed in place.
const gun: Weapon = { kind: "missile", damage: 0, rate: 1, range: 1, speed: 1, heat: 0, cooldown: 0 };

const asGun = (weapon: ArmedWeapon, kind: Weapon["kind"]): Weapon => {
  gun.kind = kind;
  gun.damage = weapon.damage;
  gun.rate = weapon.rate;
  gun.range = weapon.range;
  gun.speed = weapon.speed;

  return gun;
};

// The way to aim a weapon: where the pilot points, by hand; otherwise at what the guns would choose (led, for a
// shot that flies), or along the nose with nothing to aim at.
const aimOf = (context: VoyageContext, ship: Body, angle: number, weapon: ArmedWeapon, point: { x: number; y: number } | null): { x: number; y: number;
  target: Entity | null; } => {
  const { world, state } = context;

  if (point) {
    const length = Math.hypot(point.x - ship.x, point.y - ship.y) || 1;

    return { x: (point.x - ship.x) / length, y: (point.y - ship.y) / length, target: state.lockedTarget };
  }

  const target = chooseTarget(context, ship, Math.max(weapon.range, 4), true);
  const at = target !== null ? world.stores.body.get(target) : undefined;
  const lead = at ? (weapon.speed > 0 && weapon.speed < 30 ? leadDirection(ship, at, weapon.speed) : null) : null;

  if (at && lead) {
    return { x: lead.x, y: lead.y, target };
  }

  if (at) {
    const length = Math.hypot(at.x - ship.x, at.y - ship.y) || 1;

    return { x: (at.x - ship.x) / length, y: (at.y - ship.y) / length, target };
  }

  return { x: Math.cos(angle), y: Math.sin(angle), target: null };
};

// A railgun's slug: through everything hostile along its line, out to its range, at once.
const rail = (context: VoyageContext, ship: Body, dx: number, dy: number, weapon: ArmedWeapon): void => {
  const { world, state, events } = context;
  const x1 = ship.x + dx * weapon.range;
  const y1 = ship.y + dy * weapon.range;
  // How far along the line, and how far from it, a body sits.
  const across = (at: Body) => {
    const along = (at.x - ship.x) * dx + (at.y - ship.y) * dy;

    return along < 0 || along > weapon.range ? Infinity : Math.abs((at.x - ship.x) * dy - (at.y - ship.y) * dx) - at.radius;
  };

  world.stores.alien.entities.forEach((entity, index) => {
    const alien = world.stores.alien.values[index];
    const at = world.stores.body.get(entity);
    const disposition = alien.faction >= 0 ? state.cosmos?.factions[alien.faction]?.disposition : "peaceful";

    if (at && across(at) < 0.06 && (disposition !== "peaceful" || state.lockedTarget === entity)) {
      damageAlien(context, entity, weapon.damage, weapon.uid);
    }
  });
  world.stores.impactor.entities.forEach((entity) => {
    const at = world.stores.body.get(entity);

    if (at && across(at) < 0.06) {
      damageImpactor(context, entity, weapon.damage, dx * 2, dy * 2);
    }
  });
  world.stores.hazard.entities.forEach((entity) => {
    const at = world.stores.body.get(entity);

    if (at && across(at) < 0.06) {
      events.emit("shattered", { x: at.x, y: at.y, radius: at.radius });
      world.despawn(entity);
    }
  });
  events.emit("railed", { x0: ship.x, y0: ship.y, x1, y1 });
};

// An EMP: everyone hostile in reach has their shields stripped and is held still for a while, and every missile in
// flight against the ship within reach dies.
const pulse = (context: VoyageContext, ship: Body, weapon: ArmedWeapon): void => {
  const { world, state, events } = context;

  world.stores.alien.entities.forEach((entity, index) => {
    const alien = world.stores.alien.values[index];
    const at = world.stores.body.get(entity);
    const health = world.stores.health.get(entity);
    const disposition = alien.faction >= 0 ? state.cosmos?.factions[alien.faction]?.disposition : "peaceful";

    if (at && health && Math.hypot(at.x - ship.x, at.y - ship.y) < weapon.range && disposition !== "peaceful") {
      health.shields = 0;
      alien.stunnedUntil = state.elapsedMs + weapon.stun * 1000;
      damageAlien(context, entity, weapon.damage, weapon.uid);
    }
  });
  world.stores.projectile.entities.forEach((entity, index) => {
    const shot = world.stores.projectile.values[index];
    const at = world.stores.body.get(entity);

    if (shot.team === "aliens" && at && Math.hypot(at.x - ship.x, at.y - ship.y) < weapon.range) {
      world.despawn(entity);
    }
  });
  events.emit("pulsed", { x: ship.x, y: ship.y, radius: weapon.range });
};

// Fires a weapon from the bar, if it is armed, ready and there is the ammunition: aimed where the pilot points (by
// hand) or at what the guns would choose. A missile needs something to home on; a mine drops behind; a railgun
// pierces along its line at once; an EMP pulses round the ship; flak fans its pellets out. Every shot warms the
// hull and is heard.
export const fireWeapon = (context: VoyageContext, uid: string, point: { x: number; y: number } | null): FireOutcome => {
  const { state, events } = context;
  const parts = shipOf(context);
  const weapon = state.arsenal.find((armed) => armed.uid === uid);
  const isComingDown = state.descent !== null && state.descent.downAt === null;

  if (!parts || !weapon || state.status !== "flying" || state.phase === "lost" || state.capture || isComingDown) {
    return "unable";
  }

  if ((state.weaponReady[uid] ?? 0) > state.elapsedMs) {
    return "cooling";
  }

  if (state.ammo[weapon.ammo] < weapon.perShot) {
    events.emit("dry", { kind: weapon.kind });

    return "empty";
  }

  const { body, ship } = parts;
  const aim = aimOf(context, body, ship.angle, weapon, point);

  if (weapon.kind === "missile" && aim.target === null && !point) {
    return "noTarget";
  }

  switch (weapon.kind) {
    case "missile":
      fire(context, state.ship, asGun(weapon, "missile"), aim.x, aim.y, "ship", aim.target, { ammo: weapon.ammo, source: uid, blast: weapon.blast });
      break;
    case "mine":
      fire(context, state.ship, asGun({ ...weapon, speed: 0.15, range: MINE_LIFE * 0.15 }, "mine"), -Math.cos(ship.angle), -Math.sin(ship.angle), "ship", null, {
        ammo: weapon.ammo,
        source: uid,
        blast: weapon.blast,
        armAt: state.elapsedMs + MINE_ARM * 1000,
        trigger: weapon.range,
        inherit: 0.2,
      });
      break;
    case "railgun":
      rail(context, body, aim.x, aim.y, weapon);
      events.emit("fired", { x: body.x, y: body.y, angle: Math.atan2(aim.y, aim.x), kind: "rail", team: "ship", ammo: weapon.ammo, source: uid });
      break;
    case "emp":
      pulse(context, body, weapon);
      events.emit("fired", { x: body.x, y: body.y, angle: ship.angle, kind: "emp", team: "ship", ammo: weapon.ammo, source: uid });
      break;
    case "flak": {
      const heading = Math.atan2(aim.y, aim.x);

      for (let pellet = 0; pellet < weapon.pellets; pellet += 1) {
        const angle = heading + (pellet / Math.max(1, weapon.pellets - 1) - 0.5) * weapon.spread;

        fire(context, state.ship, asGun(weapon, "flak"), Math.cos(angle), Math.sin(angle), "ship", null, { ammo: pellet === 0 ? weapon.ammo : null, source: uid });
      }

      break;
    }
    default:
      return "unable";
  }

  state.ammo[weapon.ammo] -= weapon.perShot;
  state.weaponReady[uid] = state.elapsedMs + 1000 / weapon.rate;
  ship.temperatureC += 4;
  state.signature += 0.6;

  return "fired";
};

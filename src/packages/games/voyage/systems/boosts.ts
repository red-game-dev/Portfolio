import { TAU } from "@/packages/math/angles";
import { pick } from "@/packages/math/random";

import { BOOST_IDS, BOOSTS } from "../config/boosts";
import { BoostId } from "../domain/boosts";
import { activeLevel, boostDuration, boostStrength } from "../utils/boosts";
import { VoyageContext } from "./context";
import { placeBody, shipOf, ShipParts } from "./queries";

// A jump's path is tried in this many steps, and stops short of anything it would end inside.
const JUMP_STEPS = 12;
// A gravity well is set this far ahead of the ship (world units), or nearer where the view is smaller, so it is
// always set where the pilot can see it work: within this share of the view's shorter half.
const WELL_AHEAD = 3;
const WELL_IN_VIEW = 0.6;
// The decoy drifts back from the ship at this speed (world units a second).
const DECOY_DRIFT = 0.8;

// How far ahead a jump can go before it would end inside a world or a star, along the ship's heading.
const clearJump = ({ state }: VoyageContext, parts: ShipParts, distance: number): number => {
  const { x, y, radius } = parts.body;
  const dx = Math.cos(parts.ship.angle);
  const dy = Math.sin(parts.ship.angle);
  const blockers = [state.system.star, ...state.system.companions, ...state.system.bodies];
  let clear = 0;

  for (let step = 1; step <= JUMP_STEPS; step += 1) {
    const reach = (distance * step) / JUMP_STEPS;
    const tx = x + dx * reach;
    const ty = y + dy * reach;

    if (blockers.some((blocker) => Math.hypot(tx - blocker.x, ty - blocker.y) < blocker.radius + radius * 3)) {
      break;
    }

    clear = reach;
  }

  return clear;
};

// What a boost does the moment it is set to work, and how long it then lasts (ms; nothing for one done at once).
const begin = (context: VoyageContext, parts: ShipParts, id: BoostId, level: number): number => {
  const { state, world, random } = context;
  const { body, ship, health, modules } = parts;
  const strength = boostStrength(id, level);
  const duration = boostDuration(id, level);

  switch (id) {
    case "overcharge":
      health.shields = health.maxShields * modules.shields * strength;

      return duration;
    case "blockShield":
      state.blocks = Math.round(strength);

      return duration;
    case "decoy": {
      const decoy = world.spawn();
      const back = ship.angle + Math.PI;
      const x = body.x + Math.cos(back) * strength;
      const y = body.y + Math.sin(back) * strength;

      if (state.decoy !== null) {
        world.despawn(state.decoy);
      }

      const vx = body.vx + Math.cos(back) * DECOY_DRIFT;
      const vy = body.vy + Math.sin(back) * DECOY_DRIFT;

      world.stores.body.set(decoy, { x, y, vx, vy, prevX: x, prevY: y, radius: 0.05, mass: 0 });
      state.decoy = decoy;
      // Missiles already on their way after the ship turn after the flare instead.
      world.stores.projectile.values.forEach((shot) => {
        if (shot.team === "aliens" && shot.target === state.ship) {
          shot.target = decoy;
        }
      });

      return duration;
    }
    case "cloak":
      world.stores.alien.values.forEach((alien) => {
        alien.threat = 0;
        alien.mode = alien.mode === "chase" ? "evade" : alien.mode;
      });

      return state.readings.nebula > 0 ? duration * 2 : duration;
    case "pixelBlink":
    case "warpJump": {
      const reach = clearJump(context, parts, strength);

      placeBody(body, body.x + Math.cos(ship.angle) * reach, body.y + Math.sin(ship.angle) * reach, body.vx, body.vy);

      return 0;
    }
    case "gravityWell": {
      const room = Math.min(state.view.halfWidth, state.view.halfHeight);
      const ahead = room > 0 ? Math.min(WELL_AHEAD, room * WELL_IN_VIEW) : WELL_AHEAD;

      state.well = {
        x: body.x + Math.cos(ship.angle) * ahead,
        y: body.y + Math.sin(ship.angle) * ahead,
        mu: strength,
        until: state.elapsedMs + duration,
      };

      return duration;
    }
    case "luckyRoll": {
      const other = pick(random, BOOST_IDS.filter((choice) => choice !== "luckyRoll"));
      const better = level + Math.floor(random() * (strength + 1));
      const lasts = begin(context, parts, other, better);

      if (lasts > 0) {
        state.boosts = [...state.boosts.filter((active) => active.id !== other), { id: other, level: better, until: state.elapsedMs + lasts }];
      }

      context.events.emit("boosted", { boost: other, level: better });

      return 0;
    }
    default:
      // The rest work while they last, read where they act.
      return duration;
  }
};

// Sets a boost to work at a level, if the ship can use one now and it is ready: not while lost between universes,
// falling into a black hole or coming down, and a jump not while standing on a world. Returns whether it did.
export const activateBoost = (context: VoyageContext, id: BoostId, level: number): boolean => {
  const { state, events } = context;
  const parts = shipOf(context);
  const isComingDown = state.descent !== null && state.descent.downAt === null;
  const isJump = id === "pixelBlink" || id === "warpJump" || id === "gravityWell";

  if (!parts || state.status !== "flying" || state.phase === "lost" || state.capture || isComingDown || level < 1) {
    return false;
  }

  if ((state.boostReady[id] ?? 0) > state.elapsedMs || (isJump && parts.ship.landedOn !== null)) {
    return false;
  }

  const lasts = begin(context, parts, id, level);

  if (lasts > 0) {
    state.boosts = [...state.boosts.filter((active) => active.id !== id), { id, level, until: state.elapsedMs + lasts }];
  }

  state.boostReady[id] = state.elapsedMs + BOOSTS[id].cooldownS * 1000;
  events.emit("boosted", { boost: id, level });

  return true;
};

// A gravity well's pull, written here so asking makes nothing.
const pull = { ax: 0, ay: 0 };

// Where a gravity well pulls a body: its acceleration towards the well (world units/s^2), floored at a small
// distance so nothing is flung, or nothing while there is no well.
export const wellPull = ({ state }: VoyageContext, x: number, y: number): Readonly<{ ax: number; ay: number }> | null => {
  const { well } = state;

  if (!well || well.until <= state.elapsedMs) {
    return null;
  }

  const dx = well.x - x;
  const dy = well.y - y;
  const distance = Math.max(0.3, Math.hypot(dx, dy));
  const strength = well.mu / (distance * distance);

  pull.ax = (dx / distance) * strength;
  pull.ay = (dy / distance) * strength;

  return pull;
};

// Whether a boost is at work now, and at what level (0 when not).
export const levelOf = ({ state }: VoyageContext, id: BoostId): number => activeLevel(state, id);

// The angle shots fan out at under a prism.
export const PRISM_SPREAD = TAU / 36;

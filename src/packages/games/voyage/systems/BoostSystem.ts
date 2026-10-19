import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { activeLevel, boostToFind } from "../utils/boosts";
import { VoyageContext } from "./context";
import { isInSystem, shipOf, viewRadius } from "./queries";

// Boosts over time: each at work runs out when its time is up (a block shield's blocks and a decoy with it, a
// gravity well when its own time is up), and now and then a boost core drifts in near the ship, just inside the
// view, one of the place's own more often than not, or a cache of ammunition and gear.
// A rollback's history: a moment every quarter second, the last six seconds kept, more than the strongest goes back.
const TRAIL_EVERY_MS = 250;
const TRAIL_KEEP_MS = 6000;

export class BoostSystem implements System<VoyageContext> {
  public readonly name = "boosts";

  public update(context: VoyageContext): void {
    const { state, world } = context;
    const now = state.elapsedMs;
    let isExpired = false;

    for (const active of state.boosts) {
      isExpired = isExpired || active.until <= now;
    }

    // Only when one has run out, which is seldom, is a new list made.
    if (isExpired) {
      state.boosts = state.boosts.filter((active) => active.until > now);
    }

    if (state.blocks > 0 && activeLevel(state, "blockShield") === 0) {
      state.blocks = 0;
    }

    if (state.decoy !== null && activeLevel(state, "decoy") === 0) {
      world.despawn(state.decoy);
      state.decoy = null;
    }

    if (state.well && state.well.until <= now) {
      state.well = null;
    }

    this.remember(context);
    this.drift(context);
  }

  // The ship's moment every so often in flight, the last few seconds of them kept, for a rollback to return to.
  private remember(context: VoyageContext): void {
    const { state } = context;
    const parts = shipOf(context);
    const isFlying = state.status === "flying" && (state.phase === "solar" || state.phase === "universe");

    if (!parts || !isFlying || parts.ship.landedOn !== null || state.descent !== null) {
      state.trail.length = 0;

      return;
    }

    const last = state.trail[state.trail.length - 1];

    if (last && state.elapsedMs - last.at < TRAIL_EVERY_MS) {
      return;
    }

    const { body, ship, health } = parts;

    state.trail.push({
      at: state.elapsedMs,
      x: body.x,
      y: body.y,
      vx: body.vx,
      vy: body.vy,
      angle: ship.angle,
      hull: health.hull,
      shields: health.shields,
      fuel: ship.fuel,
    });

    while (state.trail.length > 0 && state.elapsedMs - state.trail[0].at > TRAIL_KEEP_MS) {
      state.trail.shift();
    }
  }

  private drift(context: VoyageContext): void {
    const { state, world, config, random } = context;
    const parts = shipOf(context);
    const isFlying = state.status === "flying" && (state.phase === "solar" || state.phase === "universe");

    if (!parts || !isFlying || !isInSystem(context) || parts.ship.landedOn !== null) {
      return;
    }

    const [soonest, latest] = state.phase === "universe" ? config.boosts.universeEvery : config.boosts.every;

    if (state.nextBoostAt === null) {
      state.nextBoostAt = state.elapsedMs + randomBetween(random, soonest, latest) * 1000;

      return;
    }

    if (state.elapsedMs < state.nextBoostAt) {
      return;
    }

    state.nextBoostAt = state.elapsedMs + randomBetween(random, soonest, latest) * 1000;

    const place = state.phase === "solar" ? "solar" : state.cosmos?.style ?? null;
    const isCache = random() < config.boosts.caches;
    const boost = isCache ? null : boostToFind(random, place, config.boosts.own, config.boosts.away);

    if (!isCache && !boost) {
      return;
    }

    const angle = random() * TAU;
    const out = viewRadius(context) * randomBetween(random, 0.55, 0.85);
    const x = parts.body.x + Math.cos(angle) * out;
    const y = parts.body.y + Math.sin(angle) * out;
    const core = world.spawn();

    world.stores.body.set(core, { x, y, vx: parts.body.vx * 0.5, vy: parts.body.vy * 0.5, prevX: x, prevY: y, radius: config.boosts.radius, mass: 0.01 });
    world.stores.pickup.set(core, boost ? { kind: "boost", boost } : { kind: "cache" });
  }
}

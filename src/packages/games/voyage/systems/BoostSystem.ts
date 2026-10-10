import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { boostToFind } from "../utils/boosts";
import { VoyageContext } from "./context";
import { isInSystem, shipOf, viewRadius } from "./queries";

// Boosts over time: each at work runs out when its time is up (a block shield's blocks and a decoy with it, a
// gravity well when its own time is up), and now and then a boost core drifts in near the ship, just inside the
// view, one of the place's own more often than not.
export class BoostSystem implements System<VoyageContext> {
  public readonly name = "boosts";

  public update(context: VoyageContext): void {
    const { state, world } = context;
    const now = state.elapsedMs;

    if (state.boosts.some((active) => active.until <= now)) {
      state.boosts = state.boosts.filter((active) => active.until > now);
    }

    if (state.blocks > 0 && !state.boosts.some((active) => active.id === "blockShield")) {
      state.blocks = 0;
    }

    if (state.decoy !== null && !state.boosts.some((active) => active.id === "decoy")) {
      world.despawn(state.decoy);
      state.decoy = null;
    }

    if (state.well && state.well.until <= now) {
      state.well = null;
    }

    this.drift(context);
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
    const boost = boostToFind(random, place, config.boosts.own, config.boosts.away);

    if (!boost) {
      return;
    }

    const angle = random() * TAU;
    const out = viewRadius(context) * randomBetween(random, 0.55, 0.85);
    const x = parts.body.x + Math.cos(angle) * out;
    const y = parts.body.y + Math.sin(angle) * out;
    const core = world.spawn();

    world.stores.body.set(core, { x, y, vx: parts.body.vx * 0.5, vy: parts.body.vy * 0.5, prevX: x, prevY: y, radius: config.boosts.radius, mass: 0.01 });
    world.stores.pickup.set(core, { kind: "boost", boost });
  }
}

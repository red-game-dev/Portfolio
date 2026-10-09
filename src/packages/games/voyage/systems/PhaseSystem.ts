import type { System } from "@/packages/games/engine";
import { randomBetween } from "@/packages/math/random";

import { VoyageContext } from "./context";
import { placeBody, shipOf } from "./queries";

// Time and the story: the singularity's pull grows once Pluto is behind until nothing escapes it; inside a
// black hole the ship is lost for a while; out the other side it wakes in a universe, somewhere it has not been,
// with black holes kept round it as the ways onward.
export class PhaseSystem implements System<VoyageContext> {
  public readonly name = "phase";

  public update(context: VoyageContext, dt: number): void {
    const { state, config, world } = context;
    const ms = dt * 1000;

    if (state.status !== "flying") {
      return;
    }

    state.elapsedMs += ms;
    state.phaseMs += ms;

    if (state.phase === "singularity" && state.singularitySince !== null) {
      const seconds = (state.elapsedMs - state.singularitySince) / 1000;

      world.stores.hole.values.forEach((hole) => {
        if (hole.isSingularity) {
          hole.mu = config.holes.singularityMu * (1 + seconds * config.holes.singularityGrowth);
        }
      });
    }

    if (state.phase === "lost" && state.phaseMs >= (state.universes === 0 ? config.holes.lostMs : config.holes.jumpMs)) {
      this.arrive(context);
    }

    if (state.phase === "universe") {
      state.deepMs += ms;
      this.keepHoles(context);
    }
  }

  private arrive(context: VoyageContext): void {
    const { state, config, events, random } = context;
    const parts = shipOf(context);
    const all = Array.from({ length: config.universes }, (_, index) => index).filter((index) => index !== state.universe);
    const unseen = all.filter((index) => !state.visited.includes(index));
    const choices = unseen.length > 0 ? unseen : all;
    const universe = state.universes === 0 ? 0 : choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))] ?? 0;

    state.universe = universe;
    state.universes += 1;
    state.visited = state.visited.includes(universe) ? state.visited : [...state.visited, universe];
    state.score += config.scoring.universe;
    state.phase = "universe";
    state.phaseMs = 0;
    state.passing = null;

    if (parts) {
      placeBody(parts.body, 0, 0, 0, -0.6);
      parts.ship.angle = -Math.PI / 2;
      parts.ship.prevAngle = parts.ship.angle;
      parts.health.rechargeIn = 0;
    }

    events.emit("phase", { phase: "universe", universe });
  }

  private keepHoles(context: VoyageContext): void {
    const { world, config, random } = context;
    const parts = shipOf(context);

    if (!parts) {
      return;
    }

    for (let count = world.stores.hole.size; count < config.holes.perUniverse; count += 1) {
      const angle = random() * Math.PI * 2;
      const distance = randomBetween(random, config.holes.spawnDistance[0], config.holes.spawnDistance[1]);
      const x = parts.body.x + Math.cos(angle) * distance;
      const y = parts.body.y + Math.sin(angle) * distance;
      const hole = world.spawn();

      world.stores.body.set(hole, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: config.holes.horizon, mass: 0 });
      world.stores.hole.set(hole, { mu: config.holes.mu, horizon: config.holes.horizon, isSingularity: false });
    }
  }
}

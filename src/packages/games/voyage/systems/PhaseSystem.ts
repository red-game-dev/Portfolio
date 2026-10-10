import type { System } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { randomBetween } from "@/packages/math/random";

import { massOfPull, pullOfMass } from "../utils/stars";
import { VoyageContext } from "./context";
import { enterSystem } from "./gates";
import { placeBody, shipOf } from "./queries";

// Time and the story: the singularity's pull grows once the ship is past the edge until nothing escapes it;
// inside a black hole the ship is lost for a while; out the other side it wakes in a universe never seen
// before, with black holes kept round it as the ways onward.
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
          hole.mass = massOfPull(config.layout, hole.mu);
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

  // Out the other side: a universe made from the run's seed and how many have come before (in a maze, its first
  // system), its worlds set on their orbits, its strange things wound up, and the ship somewhere among them.
  private arrive(context: VoyageContext): void {
    const { state, config, events, random, universes, themes } = context;
    const parts = shipOf(context);
    const index = state.universes;
    const cosmos = universes.generate(index, state.runSeed + (index + 1) * 7919, themes[index] ?? null);

    state.network = cosmos.network;
    state.nodes = new Map();
    state.explored = new Set([cosmos.node]);
    enterSystem(context, cosmos);
    state.universe = index;
    state.universes += 1;
    state.visited = [...state.visited, index];
    state.score += config.scoring.universe;
    state.phase = "universe";
    state.phaseMs = 0;
    state.bossFallen = false;

    if (parts) {
      const angle = random() * TAU;
      const out = cosmos.system.edge * 0.55;

      placeBody(parts.body, cosmos.system.star.x + Math.cos(angle) * out, cosmos.system.star.y + Math.sin(angle) * out, 0, 0);
      parts.ship.angle = -Math.PI / 2;
      parts.ship.prevAngle = parts.ship.angle;
      parts.ship.landedOn = null;
      parts.ship.landedOffset = null;
      parts.health.rechargeIn = 0;
    }

    events.emit("phase", { phase: "universe", universe: index });
  }

  // The ways onward: black holes kept round the ship, in a maze only in the system that holds the way on.
  private keepHoles(context: VoyageContext): void {
    const { world, config, random, state } = context;
    const parts = shipOf(context);

    if (!parts || (state.network && state.node !== state.network.exit)) {
      return;
    }

    for (let count = world.stores.hole.size; count < config.holes.perUniverse; count += 1) {
      const angle = random() * TAU;
      const distance = randomBetween(random, config.holes.spawnDistance[0], config.holes.spawnDistance[1]);
      const x = parts.body.x + Math.cos(angle) * distance;
      const y = parts.body.y + Math.sin(angle) * distance;
      // Lighter ones are commoner: drawn evenly in the logarithm of mass.
      const mass = Math.exp(randomBetween(random, Math.log(config.holes.masses[0]), Math.log(config.holes.masses[1])));
      const horizon = config.holes.horizonPerSun * mass;
      const hole = world.spawn();

      world.stores.body.set(hole, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: horizon, mass: 0 });
      world.stores.hole.set(hole, { mass, mu: pullOfMass(config.layout, mass), horizon, isSingularity: false });
    }
  }
}

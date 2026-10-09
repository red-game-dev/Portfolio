import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { distanceFromOrigin, shipOf } from "./queries";

// How close to a body counts as passing it, in its own radii, plus a margin.
const PASS_RADII = 5;

// Knows where the ship is on the way out: marks each body and belt passed (and scores the discovery), wakes the
// singularity once the last body is behind, and points the compass at what comes next.
export class NavigationSystem implements System<VoyageContext> {
  public readonly name = "navigation";

  public update(context: VoyageContext): void {
    const { state, world, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      return;
    }

    const { body } = parts;

    if (state.phase === "solar" || state.phase === "singularity") {
      const out = distanceFromOrigin(context, body);

      state.route.bodies.forEach((route) => {
        const isNear = Math.hypot(route.x - body.x, route.y - body.y) < route.radius * PASS_RADII + 0.5;
        const isBehind = out > Math.hypot(route.x - state.route.origin.x, route.y - state.route.origin.y) + route.radius * 2;

        if (!state.passed.has(route.id) && (isNear || isBehind)) {
          this.pass(context, route.id);
        }
      });

      state.route.belts.forEach((belt) => {
        // At or past its inner edge: a fast ship can cross a thin belt between two steps.
        if (!state.passed.has(belt.id) && out >= belt.inner) {
          this.pass(context, belt.id);
        }
      });

      const last = state.route.bodies[state.route.bodies.length - 1];

      if (state.passed.has(last.id) && state.singularitySince === null) {
        const hole = world.spawn();
        const { x, y } = state.route.singularity;

        world.stores.body.set(hole, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: config.holes.singularityHorizon, mass: 0 });
        world.stores.hole.set(hole, { mu: config.holes.singularityMu, horizon: config.holes.singularityHorizon, isSingularity: true });
        state.singularitySince = state.elapsedMs;
        state.phase = "singularity";
        state.phaseMs = 0;
        events.emit("phase", { phase: "singularity", universe: state.universe });
      }
    }

    state.waypoint = this.waypoint(context, body.x, body.y);
  }

  private pass(context: VoyageContext, id: string): void {
    const { state, config, events } = context;

    state.passed.add(id);
    state.passing = id;
    state.score += config.scoring.discovery;
    events.emit("passing", { stop: id });
  }

  // The next body not yet passed, then the singularity; in a universe, the nearest black hole.
  private waypoint({ state, world }: VoyageContext, x: number, y: number) {
    if (state.phase === "universe") {
      let nearest: { id: string; x: number; y: number } | null = null;
      let best = Infinity;

      world.stores.hole.entities.forEach((entity) => {
        const hole = world.stores.body.get(entity);
        const distance = hole ? Math.hypot(hole.x - x, hole.y - y) : Infinity;

        if (hole && distance < best) {
          best = distance;
          nearest = { id: "hole", x: hole.x, y: hole.y };
        }
      });

      return nearest;
    }

    if (state.phase === "lost") {
      return null;
    }

    const next = state.route.bodies.find((route) => !state.passed.has(route.id));

    return next ? { id: next.id, x: next.x, y: next.y } : { id: "singularity", x: state.route.singularity.x, y: state.route.singularity.y };
  }
}

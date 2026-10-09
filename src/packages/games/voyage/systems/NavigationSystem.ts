import type { System } from "@/packages/games/engine";

import { Waypoint } from "../domain/state";
import { VoyageContext } from "./context";
import { distanceFromStar, isInSystem, shipOf } from "./queries";

// How close to a body counts as visiting it, in its own radii, plus a margin.
const PASS_RADII = 5;
const PASS_MARGIN = 0.5;
// The star counts as visited this many of its radii out: close enough to feel it.
const STAR_RADII = 2.2;
// How far ahead of the ship the singularity wakes, past the edge.
const SINGULARITY_AHEAD = 9;

// Knows where the ship is in the system: marks each body and belt it reaches (and scores the discovery), wakes
// the singularity ahead of the ship once it crosses the edge of the system, and points the compass at the
// nearest place it has not been, then out to the edge.
export class NavigationSystem implements System<VoyageContext> {
  public readonly name = "navigation";

  public update(context: VoyageContext): void {
    const { state, world, config, events } = context;
    const parts = shipOf(context);

    if (!parts || state.status !== "flying") {
      return;
    }

    const { body } = parts;

    if (isInSystem(context)) {
      const { system } = state;
      const out = distanceFromStar(context, body);

      system.bodies.forEach((place) => {
        if (!state.passed.has(place.id) && Math.hypot(place.x - body.x, place.y - body.y) < place.radius * PASS_RADII + PASS_MARGIN) {
          this.pass(context, place.id);
        }
      });

      if (!state.passed.has(system.star.id) && out < system.star.radius * STAR_RADII) {
        this.pass(context, system.star.id);
      }

      system.belts.forEach((belt) => {
        if (!state.passed.has(belt.id) && out >= belt.inner && out <= belt.outer) {
          this.pass(context, belt.id);
        }
      });

      if (out > system.edge && state.singularitySince === null) {
        const speed = Math.hypot(body.vx, body.vy);
        // Ahead of the ship if it is moving, otherwise straight out from the star.
        const dx = speed > 0.2 ? body.vx / speed : (body.x - system.star.x) / out;
        const dy = speed > 0.2 ? body.vy / speed : (body.y - system.star.y) / out;
        const x = body.x + dx * SINGULARITY_AHEAD;
        const y = body.y + dy * SINGULARITY_AHEAD;
        const hole = world.spawn();

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

  // In the system: the singularity once it wakes, else the nearest planet, dwarf planet or the star not yet
  // visited, else the edge straight out. In a universe, the nearest black hole.
  private waypoint(context: VoyageContext, x: number, y: number): Waypoint | null {
    const { state, world, config } = context;

    if (state.phase === "lost") {
      return null;
    }

    const candidates: Waypoint[] = [];

    world.stores.hole.entities.forEach((entity, index) => {
      const hole = world.stores.body.get(entity);
      const { isSingularity } = world.stores.hole.values[index];

      if (hole && (state.phase === "universe" || isSingularity)) {
        candidates.push({ id: isSingularity ? "singularity" : "hole", x: hole.x, y: hole.y, radius: isSingularity ? config.holes.singularityHorizon : hole.radius });
      }
    });

    if (candidates.length === 0 && state.phase !== "universe") {
      const { system } = state;

      system.bodies.forEach((body) => {
        if (body.kind !== "moon" && !state.passed.has(body.id)) {
          candidates.push({ id: body.id, x: body.x, y: body.y, radius: body.radius });
        }
      });

      if (!state.passed.has(system.star.id)) {
        candidates.push({ id: system.star.id, x: system.star.x, y: system.star.y, radius: system.star.radius });
      }

      if (candidates.length === 0) {
        const out = Math.hypot(x - system.star.x, y - system.star.y) || 1;

        return {
          id: "edge",
          x: system.star.x + ((x - system.star.x) / out) * system.edge,
          y: system.star.y + ((y - system.star.y) / out) * system.edge,
          radius: 0,
        };
      }
    }

    return candidates.reduce<Waypoint | null>((best, candidate) => (
      !best || Math.hypot(candidate.x - x, candidate.y - y) < Math.hypot(best.x - x, best.y - y) ? candidate : best
    ), null);
  }
}

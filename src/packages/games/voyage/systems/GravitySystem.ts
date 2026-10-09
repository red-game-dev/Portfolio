import type { System } from "@/packages/games/engine";

import { VoyageContext } from "./context";
import { shipOf } from "./queries";

// Every planet and black hole pulls on everything that moves, by Newton's law. The ship's reading of the field
// (how strong, who pulls hardest, how near the nearest black hole) is kept for the telemetry.
export class GravitySystem implements System<VoyageContext> {
  public readonly name = "gravity";

  public update(context: VoyageContext, dt: number): void {
    const { state, world, field, sample, sources, sourceIds } = context;

    sources.length = 0;
    sourceIds.length = 0;

    if (state.phase === "solar" || state.phase === "singularity") {
      state.route.bodies.forEach((route) => {
        sources.push({ x: route.x, y: route.y, mu: route.mu, radius: route.radius });
        sourceIds.push(route.id);
      });
    }

    world.stores.hole.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (body) {
        sources.push({ x: body.x, y: body.y, mu: hole.mu, radius: hole.horizon * 0.5 });
        sourceIds.push(hole.isSingularity ? "singularity" : "hole");
      }
    });

    field.setSources(sources);

    world.stores.hazard.entities.forEach((entity) => {
      const body = world.stores.body.get(entity);

      if (body) {
        field.sample(body.x, body.y, sample);
        body.vx += sample.ax * dt;
        body.vy += sample.ay * dt;
      }
    });

    const parts = shipOf(context);

    if (!parts || state.capture || parts.ship.landedOn) {
      return;
    }

    const { body } = parts;

    field.sample(body.x, body.y, sample);
    body.vx += sample.ax * dt;
    body.vy += sample.ay * dt;
    state.readings.gravity = sample.magnitude;
    state.readings.dominant = sample.dominant >= 0 ? sourceIds[sample.dominant] ?? null : null;
    state.readings.dominantDistance = sample.dominantDistance;
    state.readings.holeRatio = Infinity;

    world.stores.hole.entities.forEach((entity, index) => {
      const hole = world.stores.body.get(entity);

      if (hole) {
        state.readings.holeRatio = Math.min(state.readings.holeRatio, Math.hypot(hole.x - body.x, hole.y - body.y) / world.stores.hole.values[index].horizon);
      }
    });
  }
}

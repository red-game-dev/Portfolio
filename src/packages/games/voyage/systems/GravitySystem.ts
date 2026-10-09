import type { System } from "@/packages/games/engine";

import { auForRadius } from "../utils/scale";
import { VoyageContext } from "./context";
import { isInSystem, shipOf } from "./queries";

const KM_PER_AU = 149597870.7;

// The star's real pull (m/s^2) at a world distance from it: its surface gravity over the square of the real
// distance in its radii.
const starPull = ({ state }: VoyageContext, distance: number): number => {
  const { star, scale } = state.system;
  const radiusKm = star.radius * star.kmPerUnit;
  const realKm = distance <= star.radius ? radiusKm : auForRadius(scale, distance) * KM_PER_AU;

  return star.surfaceGravity * (radiusKm / realKm) ** 2;
};

// Every body, the star and every black hole pull on everything that moves, by Newton's law. The ship's reading
// is kept in real units for the telemetry: what pulls hardest, and its pull, a planet's as its real surface
// gravity scaled by distance and the star's from the real distance to it (so near Earth's orbit it reads the
// Sun's true 0.006 m/s^2).
export class GravitySystem implements System<VoyageContext> {
  public readonly name = "gravity";

  public update(context: VoyageContext, dt: number): void {
    const { state, world, field, sample, sources, sourceIds, config } = context;
    const inSystem = isInSystem(context);
    const { star } = state.system;

    sources.length = 0;
    sourceIds.length = 0;

    if (inSystem) {
      sources.push({ x: star.x, y: star.y, mu: star.mu, radius: star.radius });
      sourceIds.push(star.id);
      state.system.bodies.forEach((body) => {
        sources.push({ x: body.x, y: body.y, mu: body.mu, radius: body.radius });
        sourceIds.push(body.id);
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

    // Drifting rocks, and rocks headed for worlds, fall as everything does.
    [world.stores.hazard, world.stores.impactor].forEach((store) => store.entities.forEach((entity) => {
      const body = world.stores.body.get(entity);

      if (body) {
        field.sample(body.x, body.y, sample);
        body.vx += sample.ax * dt;
        body.vy += sample.ay * dt;
      }
    }));

    const parts = shipOf(context);

    if (!parts || state.capture || parts.ship.landedOn) {
      return;
    }

    const { body } = parts;

    field.sample(body.x, body.y, sample);
    body.vx += sample.ax * dt;
    body.vy += sample.ay * dt;

    // What pulls hardest is decided by the pulls the ship feels; the reading is that body's pull in real units.
    const source = sources[sample.dominant];
    const id = sourceIds[sample.dominant] ?? null;

    state.readings.dominant = source ? id : null;
    state.readings.dominantDistance = sample.dominantDistance;
    state.readings.holeRatio = Infinity;
    state.readings.gravity = !source ? 0 : id === star.id
      ? starPull(context, sample.dominantDistance)
      : source.mu / Math.max(source.radius, sample.dominantDistance) ** 2 / config.layout.gravityScale;

    world.stores.hole.entities.forEach((entity, index) => {
      const hole = world.stores.body.get(entity);

      if (hole) {
        state.readings.holeRatio = Math.min(state.readings.holeRatio, Math.hypot(hole.x - body.x, hole.y - body.y) / world.stores.hole.values[index].horizon);
      }
    });
  }
}

import type { System } from "@/packages/games/engine";
import { tidalAcceleration } from "@/packages/physics/newtonian";

import { SystemStar } from "../domain/content";
import { auForRadius } from "../utils/scale";
import { VoyageContext } from "./context";
import { tear } from "./damage";
import { isInSystem, shipOf } from "./queries";

// The least distance outside a black hole's horizon its pull is told at, as a share of the horizon.
const HORIZON_FLOOR = 0.05;

const KM_PER_AU = 149597870.7;

// A star's real pull (m/s^2) at a world distance from it: its surface gravity over the square of the real
// distance in its radii.
const starPull = ({ state }: VoyageContext, star: SystemStar, distance: number): number => {
  const { scale } = state.system;
  const radiusKm = star.radius * star.kmPerUnit;
  const realKm = distance <= star.radius ? radiusKm : auForRadius(scale, distance) * KM_PER_AU;

  return star.surfaceGravity * (radiusKm / realKm) ** 2;
};

// Every body, every star and every black hole pull on everything that moves, by Newton's law. The ship's reading
// is kept in real units for the telemetry: what pulls hardest, and its pull, a planet's as its real surface
// gravity scaled by distance and the star's from the real distance to it (so near Earth's orbit it reads the
// Sun's true 0.006 m/s^2).
export class GravitySystem implements System<VoyageContext> {
  public readonly name = "gravity";

  public update(context: VoyageContext, dt: number): void {
    const { state, world, field, sample, sources, sourceIds, config } = context;
    const inSystem = isInSystem(context);
    const { star, companions } = state.system;

    sources.length = 0;
    sourceIds.length = 0;
    state.readings.tidal = 0;

    if (inSystem) {
      sources.push({ x: star.x, y: star.y, mu: star.mu, radius: star.radius });
      sourceIds.push(star.id);
      companions.forEach((other) => {
        sources.push({ x: other.x, y: other.y, mu: other.mu, radius: other.radius });
        sourceIds.push(other.id);
      });
      state.system.bodies.forEach((body) => {
        sources.push({ x: body.x, y: body.y, mu: body.mu, radius: body.radius });
        sourceIds.push(body.id);
      });
    }

    world.stores.hole.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (body) {
        sources.push({ x: body.x, y: body.y, mu: hole.mu, radius: hole.horizon * HORIZON_FLOOR, horizon: hole.horizon });
        sourceIds.push(hole.isSingularity ? "singularity" : "hole");
      }
    });

    field.setSources(sources);

    // Drifting rocks, and rocks headed for worlds, fall as everything does.
    [world.stores.hazard, world.stores.impactor, world.stores.wreck].forEach((store) => store.entities.forEach((entity) => {
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
    const pulling = id === star.id ? star : companions.find((other) => other.id === id);

    state.readings.gravity = !source ? 0 : pulling
      ? starPull(context, pulling, sample.dominantDistance)
      : source.mu / Math.max(source.radius, sample.dominantDistance - (source.horizon ?? 0)) ** 2 / config.layout.gravityScale;

    // Each black hole slows clocks, and close in its tides stretch the ship.
    world.stores.hole.entities.forEach((entity, index) => {
      const at = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (at) {
        const distance = Math.hypot(at.x - body.x, at.y - body.y);
        const tidal = tidalAcceleration(hole.mu, Math.max(hole.horizon * HORIZON_FLOOR, distance - hole.horizon), body.radius * 2);

        state.readings.holeRatio = Math.min(state.readings.holeRatio, distance / hole.horizon);
        state.readings.tidal = Math.max(state.readings.tidal, tidal);
        tear(context, tidal, Math.atan2(at.y - body.y, at.x - body.x), dt);
      }
    });
  }
}

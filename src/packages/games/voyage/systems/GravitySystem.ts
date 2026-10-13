import type { System } from "@/packages/games/engine";
import { GravitySource, innermostStableOrbit, tidalAcceleration } from "@/packages/physics/newtonian";

import { SystemStar } from "../domain/content";
import { auForRadius } from "../utils/scale";
import { wellPull } from "./boosts";
import { VoyageContext } from "./context";
import { tear } from "./damage";
import { gravityFelt } from "./liftoff";
import { isInSystem, shipOf } from "./queries";

// The least distance outside a black hole's horizon its pull is told at, as a share of the horizon.
const HORIZON_FLOOR = 0.05;

// Whether a point lies inside three horizons of any black hole among the sources from `first` on.
const isSwallowed = (sources: readonly GravitySource[], first: number, x: number, y: number): boolean => {
  for (let index = first; index < sources.length; index += 1) {
    const hole = sources[index];

    if (Math.hypot(x - hole.x, y - hole.y) < innermostStableOrbit(hole.horizon ?? 0)) {
      return true;
    }
  }

  return false;
};

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

    // The black holes go last, so the swallowing below walks only them.
    const firstHole = sources.length;

    world.stores.hole.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (body) {
        sources.push({ x: body.x, y: body.y, mu: hole.mu, radius: hole.horizon * HORIZON_FLOOR, horizon: hole.horizon });
        sourceIds.push(hole.isSingularity ? "singularity" : "hole");
      }
    });

    field.setSources(sources);

    // Drifting rocks, rocks headed for worlds and wrecks fall as everything does; inside three horizons of a black hole,
    // where nothing can circle, they are gone into it, rather than swinging through and out again at many times the
    // ship's speed, which would make the plunge on to the next universe a lottery.
    [world.stores.hazard, world.stores.impactor, world.stores.wreck].forEach((store) => store.entities.forEach((entity) => {
      const body = world.stores.body.get(entity);

      if (body && firstHole < sources.length && isSwallowed(sources, firstHole, body.x, body.y)) {
        world.despawn(entity);

        return;
      }

      if (body) {
        field.sample(body.x, body.y, sample);
        body.vx += sample.ax * dt;
        body.vy += sample.ay * dt;

        // A gravity well the pilot set down pulls them too.
        const well = wellPull(context, body.x, body.y);

        if (well) {
          body.vx += well.ax * dt;
          body.vy += well.ay * dt;
        }
      }
    }));

    const parts = shipOf(context);

    if (!parts || state.capture || parts.ship.landedOn) {
      return;
    }

    const { body } = parts;
    // Just lifted off, gravity comes back only as fast as the grace runs, so the climb clears the ground and anything
    // pulling beside it.
    const felt = gravityFelt(state);

    field.sample(body.x, body.y, sample);
    body.vx += sample.ax * felt * dt;
    body.vy += sample.ay * felt * dt;

    if (state.liftoff && state.elapsedMs >= state.liftoff.untilMs) {
      state.liftoff = null;
    }

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

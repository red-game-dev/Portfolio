import { centuriesSinceJ2000, daysSinceJ2000, DEG, earthSubsolarPoint, heliocentricPosition, julianDay, subsolarLatitude, wrapDegrees } from "@/packages/physics/kepler";

import { StarSystem, SystemBody } from "../domain/content";
import { MissionClock } from "../domain/state";
import { radiusForAu } from "../utils/scale";

const MS_PER_HOUR = 3600000;

// Each system's bodies by id, made once rather than every step.
const bodiesById = new WeakMap<StarSystem, Map<string, SystemBody>>();

const byIdOf = (system: StarSystem): Map<string, SystemBody> => {
  const known = bodiesById.get(system);

  if (known && known.size === system.bodies.length) {
    return known;
  }

  const made = new Map(system.bodies.map((body) => [body.id, body]));

  bodiesById.set(system, made);

  return made;
};

// The real moment the mission clock reads after `elapsedMs` of flying.
export const missionTime = (clock: MissionClock, elapsedMs: number): number => clock.epochMs + (elapsedMs / 1000) * clock.hoursPerSecond * MS_PER_HOUR;

// Puts every body where it is at a moment: planets round the Sun by their elements, mapped into the world by
// the system's scale (their real direction kept), moons on their circles round their planets, and the point
// under the Sun on each: Earth's from the real time of day, a locked moon's left to whoever draws it (it faces
// its planet), the rest from the length of their day and the tilt of their pole. With `dt`, each body's
// velocity is how far that moved it since the last call.
export const placeBodies = (system: StarSystem, moment: number, dt = 0): void => {
  const jd = julianDay(moment);
  const centuries = centuriesSinceJ2000(jd);
  const days = daysSinceJ2000(jd);
  const hours = days * 24;
  const byId = byIdOf(system);

  system.bodies.forEach((body) => {
    const lastX = body.x;
    const lastY = body.y;

    if (body.orbit.kind === "sun") {
      const real = heliocentricPosition(body.orbit.elements, centuries, body.real);
      const au = Math.hypot(real.x, real.y, real.z);
      const distance = radiusForAu(system.scale, au);
      const angle = Math.atan2(real.y, real.x);

      body.au = au;
      // Screen y runs down, so the ecliptic's anticlockwise stays anticlockwise on screen.
      body.x = system.star.x + Math.cos(angle) * distance;
      body.y = system.star.y - Math.sin(angle) * distance;
    } else {
      const parent = byId.get(body.orbit.parent);
      const phase = (body.orbit.longitudeAtEpoch + (360 * days) / body.orbit.periodDays) * DEG;

      if (parent) {
        body.real.x = parent.real.x;
        body.real.y = parent.real.y;
        body.real.z = parent.real.z;
        body.au = parent.au;
        body.x = parent.x + Math.cos(phase) * body.orbit.distance;
        body.y = parent.y - Math.sin(phase) * body.orbit.distance;
      }
    }

    if (dt > 0) {
      body.vx = (body.x - lastX) / dt;
      body.vy = (body.y - lastY) / dt;
    }

    if (body.id === "earth") {
      const point = earthSubsolarPoint(jd, body.real);

      body.subsolarLongitude = point.longitude;
      body.subsolarLatitude = point.latitude;
    } else if (body.dayHours !== null) {
      body.subsolarLongitude = wrapDegrees((-360 * hours) / body.dayHours);
      body.subsolarLatitude = subsolarLatitude(body.pole, body.real);
    } else {
      body.subsolarLatitude = subsolarLatitude(body.pole, body.real);
    }
  });
};

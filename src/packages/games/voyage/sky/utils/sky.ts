import { RAD, wrapDegrees } from "@/packages/math/angles";

import { HOME_WORLD, StarSystem } from "../../domain/content";
import { METEOR_SHOWERS, NAKED_EYE, OUTER, SKY_LIMITS } from "../config/showers";
import { SkyEvent } from "../domain/sky";

const DAY_MS = 24 * 60 * 60 * 1000;

// A month and day in a year, as a moment at noon UTC.
const dayOf = (year: number, [month, day]: [number, number]): number => Date.UTC(year, month - 1, day, 12);

// The meteor showers active at a moment, a window that runs across the new year (December into January) read either
// side of it; a shower is at its peak within a day and a half of its peak night.
export const showersOn = (moment: number): SkyEvent[] => {
  const year = new Date(moment).getUTCFullYear();

  return METEOR_SHOWERS.flatMap((shower) => {
    const wraps = shower.end[0] < shower.start[0];
    const windows = wraps
      ? [year - 1, year].map((from) => [dayOf(from, shower.start), dayOf(from + 1, shower.end)])
      : [[dayOf(year, shower.start), dayOf(year, shower.end)]];
    const isActive = windows.some(([start, end]) => moment >= start - DAY_MS / 2 && moment <= end + DAY_MS / 2);

    if (!isActive) {
      return [];
    }

    const peaks = [year - 1, year, year + 1].map((at) => dayOf(at, shower.peak));
    const isPeak = peaks.some((peak) => Math.abs(moment - peak) <= DAY_MS * 1.5);

    return [{ id: `shower:${shower.id}`, kind: "shower", subjects: [shower.id], isPeak }];
  });
};

// Where a planet stands in Earth's sky, as an ecliptic longitude in degrees, from the real positions a placed system
// carries (AU, heliocentric).
const longitudeFrom = (from: { x: number; y: number }, to: { x: number; y: number }): number => wrapDegrees(Math.atan2(to.y - from.y, to.x - from.x) * RAD);

// The gap between two longitudes, 0 to 180 degrees.
const apart = (first: number, second: number): number => Math.abs(wrapDegrees(first - second));

// Planets close together in the sky (a conjunction) and outer planets opposite the Sun (at opposition), read from a
// system placed at the moment, as seen from Earth; only planets far enough from the Sun's glare to be seen.
export const alignmentsIn = (system: StarSystem): SkyEvent[] => {
  const earth = system.bodies.find((body) => body.id === HOME_WORLD);

  if (!earth) {
    return [];
  }

  const sun = longitudeFrom(earth.real, { x: 0, y: 0 });
  const planets = NAKED_EYE.map((id) => system.bodies.find((body) => body.id === id))
    .filter((body): body is NonNullable<typeof body> => body !== undefined)
    .map((body) => ({ id: body.id, longitude: longitudeFrom(earth.real, body.real) }))
    .filter(({ longitude }) => apart(longitude, sun) >= SKY_LIMITS.sunClearance);
  const events: SkyEvent[] = [];

  planets.forEach((first, index) => planets.slice(index + 1).forEach((second) => {
    if (apart(first.longitude, second.longitude) <= SKY_LIMITS.conjunction) {
      events.push({ id: `conjunction:${first.id}:${second.id}`, kind: "conjunction", subjects: [first.id, second.id], isPeak: false });
    }
  }));
  planets.filter(({ id }) => OUTER.includes(id)).forEach(({ id, longitude }) => {
    if (apart(longitude, sun) >= 180 - SKY_LIMITS.opposition) {
      events.push({ id: `opposition:${id}`, kind: "opposition", subjects: [id], isPeak: false });
    }
  });

  return events;
};

// Everything in the real sky at a moment: the showers by the date, the alignments by where the planets are.
export const skyEventsOn = (system: StarSystem, moment: number): SkyEvent[] => [...showersOn(moment), ...alignmentsIn(system)];

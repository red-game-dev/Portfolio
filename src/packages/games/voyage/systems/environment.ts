import { lerp } from "@/packages/math/easing";

import { Body, Ship } from "../domain/components";
import { HOME_WORLD, SystemStar } from "../domain/content";
import { fluxFrom, starAt } from "../utils/stars";
import { VoyageContext } from "./context";
import { isInSystem } from "./queries";

// Sunlight at 1 AU (W/m^2), the temperature of a dark body in equilibrium with it (kelvin), and the sky's.
const SOLAR_CONSTANT = 1361;
const EQUILIBRIUM_1AU = 278.6;
const DEEP_SPACE_C = -270;
const ABSOLUTE_ZERO = -273.15;
// Cosmic rays everywhere, and the Sun's share at 1 AU (microsieverts an hour); Earth's field shelters the
// ship within a few of its radii; Jupiter's belts peak near Io.
const COSMIC = 25;
const SOLAR = 40;
const SHELTER_RADII = 3;
const JUPITER_BELTS = { peak: 300000, at: 2.5, width: 3 };
// Below this altitude the ship takes the ground's temperature.
const GROUND = 0.03;

export interface Environment {
  temperatureC: number;
  sunlight: number;
  radiation: number;
  // The direction (world angle) the heat comes from, for where it marks the hull.
  heatAngle: number;
}

// What surrounds the ship: the temperature it is driven towards, the sunlight on it and the radiation through
// it. In open space the temperature is a dark body's in equilibrium with the light of every star at its real
// distance (5 C at Earth's orbit, -230 C past Pluto, molten close in), or the cold of space in a planet's shadow; in air, the
// air's; on the ground of an airless world, the ground's, by day or by night.
export const environmentAt = (context: VoyageContext, body: Body, ship: Ship): Environment => {
  const { state } = context;

  if (!isInSystem(context)) {
    return { temperatureC: DEEP_SPACE_C, sunlight: 0, radiation: COSMIC + state.stormDose, heatAngle: 0 };
  }

  const { system } = state;
  const { star, bodies } = system;
  // The light of every star that no world shadows, adding up; the heat comes from the brightest.
  let flux = 0;
  let brightest = star;
  let brightestFlux = -1;
  const shine = (source: SystemStar) => {
    const toStarX = source.x - body.x;
    const toStarY = source.y - body.y;
    const distance = Math.hypot(toStarX, toStarY) || 1;
    const shadowed = bodies.some((place) => {
      // Behind a body from the star, within its radius of the line to the star.
      const px = place.x - body.x;
      const py = place.y - body.y;
      const along = (px * toStarX + py * toStarY) / distance;

      return along > 0 && along < distance && Math.abs(px * toStarY - py * toStarX) / distance < place.radius * 0.95;
    });
    const light = shadowed ? 0 : fluxFrom(system, source, distance);

    flux += light;

    if (light > brightestFlux) {
      brightest = source;
      brightestFlux = light;
    }
  };

  shine(star);
  system.companions.forEach(shine);

  const inside = starAt(system, body.x, body.y);
  const heatAngle = Math.atan2(brightest.y - body.y, brightest.x - body.x);
  const isDark = flux <= 0;
  const sunlight = SOLAR_CONSTANT * flux;
  // A dark body's equilibrium temperature goes as the fourth root of the light reaching it.
  const lit = EQUILIBRIUM_1AU * flux ** 0.25 + ABSOLUTE_ZERO;
  const radiant = inside && inside.luminosity > 0 ? inside.temperatureK + ABSOLUTE_ZERO : isDark ? DEEP_SPACE_C : lit;
  let temperatureC = radiant;
  let radiation = COSMIC + SOLAR * flux + state.stormDose;

  bodies.forEach((place) => {
    const away = Math.hypot(body.x - place.x, body.y - place.y);

    if (place.id === HOME_WORLD && away < place.radius * SHELTER_RADII) {
      radiation *= 0.15;
    }

    if (place.id === "jupiter") {
      const reach = (away / place.radius - JUPITER_BELTS.at) / JUPITER_BELTS.width;

      radiation += JUPITER_BELTS.peak * Math.exp(-reach * reach);
    }

    const landedHere = ship.landedOn === place.id;
    // Still on the way down to it, the craft is high over the ground, not on it.
    const isComingDown = landedHere && state.descent !== null && state.descent.downAt === null;

    if (!place.air && !isComingDown && (landedHere || away - place.radius - body.radius < GROUND)) {
      // Day or night where the ship is: the sun's height over it.
      const sun = brightest;
      const facing = ((body.x - place.x) * (sun.x - place.x) + (body.y - place.y) * (sun.y - place.y)) / (away * Math.hypot(sun.x - place.x, sun.y - place.y) || 1);

      temperatureC = lerp(place.nightC, place.dayC, Math.max(0, facing));
    }
  });

  if (state.readings.airC !== null) {
    // Thick air sets the temperature; thin air only nudges it.
    const weight = Math.min(1, state.readings.pressureBar / 0.05);

    temperatureC = lerp(temperatureC, state.readings.airC, weight);
  }

  return { temperatureC, sunlight, radiation, heatAngle };
};

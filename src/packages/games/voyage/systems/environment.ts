import { Body, Ship } from "../domain/components";
import { auForRadius } from "../utils/scale";
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
// it. In open space the temperature is a dark body's in equilibrium with the Sun at its real distance (5 C at
// Earth's orbit, -230 C past Pluto, molten close in), or the cold of space in a planet's shadow; in air, the
// air's; on the ground of an airless world, the ground's, by day or by night.
export const environmentAt = (context: VoyageContext, body: Body, ship: Ship): Environment => {
  const { state } = context;

  if (!isInSystem(context)) {
    return { temperatureC: DEEP_SPACE_C, sunlight: 0, radiation: COSMIC + state.stormDose, heatAngle: 0 };
  }

  const { star, scale, bodies } = state.system;
  const toStarX = star.x - body.x;
  const toStarY = star.y - body.y;
  const distance = Math.hypot(toStarX, toStarY);
  const heatAngle = Math.atan2(toStarY, toStarX);
  const inside = distance <= star.radius;
  const au = auForRadius(scale, Math.max(distance, star.radius));
  const shadowed = !inside && bodies.some((place) => {
    // Behind a body from the star, within its radius of the line to the star.
    const px = place.x - body.x;
    const py = place.y - body.y;
    const along = (px * toStarX + py * toStarY) / distance;

    return along > 0 && along < distance && Math.abs(px * toStarY - py * toStarX) / distance < place.radius * 0.95;
  });
  const { luminosity } = star;
  const isDark = shadowed || luminosity <= 0;
  const sunlight = isDark ? 0 : (SOLAR_CONSTANT * luminosity) / (au * au);
  // A dark body's equilibrium temperature goes as the fourth root of the light reaching it.
  const lit = (EQUILIBRIUM_1AU * luminosity ** 0.25) / Math.sqrt(au) + ABSOLUTE_ZERO;
  const radiant = inside && luminosity > 0 ? star.temperatureK + ABSOLUTE_ZERO : isDark ? DEEP_SPACE_C : lit;
  let temperatureC = radiant;
  let radiation = COSMIC + (SOLAR * luminosity) / (au * au) + state.stormDose;

  bodies.forEach((place) => {
    const away = Math.hypot(body.x - place.x, body.y - place.y);

    if (place.id === "earth" && away < place.radius * SHELTER_RADII) {
      radiation *= 0.15;
    }

    if (place.id === "jupiter") {
      const reach = (away / place.radius - JUPITER_BELTS.at) / JUPITER_BELTS.width;

      radiation += JUPITER_BELTS.peak * Math.exp(-reach * reach);
    }

    const landedHere = ship.landedOn === place.id;

    if (!place.air && (landedHere || away - place.radius - body.radius < GROUND)) {
      // Day or night where the ship is: the sun's height over it.
      const facing = ((body.x - place.x) * (star.x - place.x) + (body.y - place.y) * (star.y - place.y)) / (away * Math.hypot(star.x - place.x, star.y - place.y) || 1);

      temperatureC = place.nightC + (place.dayC - place.nightC) * Math.max(0, facing);
    }
  });

  if (state.readings.airC !== null) {
    // Thick air sets the temperature; thin air only nudges it.
    const weight = Math.min(1, state.readings.pressureBar / 0.05);

    temperatureC = temperatureC + (state.readings.airC - temperatureC) * weight;
  }

  return { temperatureC, sunlight, radiation, heatAngle };
};

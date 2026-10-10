import { pickWeighted, RandomSource, randomBetween } from "@/packages/math/random";

import { AirRecipe, GAS, MOON_CLASSES, WORLD_CLASS_IDS, WORLD_CLASSES } from "../config/worlds";
import { AirData } from "../domain/content";
import { StarKind, WorldClass } from "../domain/universe";

const ABSOLUTE_ZERO = -273.15;
// A dark body's temperature 1 AU from the Sun (K), which goes as the fourth root of the light reaching it.
const EQUILIBRIUM_1AU = 278.6;
// The coldest a world with no star is kept warm by its own heat (Celsius).
const ROGUE_C = -230;
// No moon is larger than this many Earth radii, unless it is a world life could arise on, circling a giant.
const MOON_RADIUS = 0.6;
const LIVING_MOON_RADIUS = 1;

// The temperature (Celsius) a dark body comes to at a distance (AU) from a star of a brightness against the Sun's.
export const equilibriumC = (luminosity: number, au: number): number =>
  (luminosity > 0 ? (EQUILIBRIUM_1AU * luminosity ** 0.25) / Math.sqrt(au) + ABSOLUTE_ZERO : ROGUE_C);

// The kind of world that forms at that temperature round that star, in a galaxy that rich in metals: each kind that
// can, as likely as its weight, scaled by how much it needs the heavy elements the galaxy has. No star, a rogue.
export const classFor = (random: RandomSource, temperatureC: number, star: StarKind | null, metals: number, among?: readonly WorldClass[]): WorldClass => {
  if (!star) {
    return "rogue";
  }

  const options = (among ?? WORLD_CLASS_IDS).flatMap((kind): Array<[WorldClass, number]> => {
    const spec = WORLD_CLASSES[kind];
    const fits = spec.weight > 0 && temperatureC >= spec.coldest && temperatureC <= spec.warmest && (!spec.stars || spec.stars.includes(star)) &&
      !spec.avoids?.includes(star);

    return fits ? [[kind, spec.weight * metals ** spec.metals]] : [];
  });

  return pickWeighted(random, options, ([, weight]) => weight)?.[0] ?? (temperatureC > 300 ? "lava" : temperatureC > -60 ? "rocky" : "icy");
};

// A moon's kind: as warm as its planet's zone, warmer for a near moon of a giant flexed by tides as Io is.
export const moonClassFor = (random: RandomSource, temperatureC: number, star: StarKind | null, metals: number, order: number, isGiantParent: boolean): WorldClass => {
  if (isGiantParent && order === 0 && random() < 0.35) {
    return "volcanic";
  }

  const among = isGiantParent ? MOON_CLASSES : MOON_CLASSES.filter((kind) => kind !== "terran" && kind !== "haze");

  return classFor(random, temperatureC, star, metals, among);
};

// How big a world of a kind is, in Earth radii, kept moon sized for a moon.
export const radiusFor = (random: RandomSource, kind: WorldClass, isMoon: boolean): number => {
  const [smallest, largest] = WORLD_CLASSES[kind].radius;
  const limit = isMoon ? (WORLD_CLASSES[kind].isHabitable ? LIVING_MOON_RADIUS : MOON_RADIUS) : Infinity;

  return randomBetween(random, Math.min(smallest, limit * 0.5), Math.min(largest, limit));
};

// The pull at a world's surface (m/s^2): as its radius times its density, against Earth's.
export const gravityFor = (random: RandomSource, kind: WorldClass, radiusEarths: number): number => {
  const [low, high] = WORLD_CLASSES[kind].density;

  return 9.81 * radiusEarths * randomBetween(random, low, high);
};

// The air a kind of world keeps at a temperature, with the gas it is made of: none, thin carbon dioxide, air like
// ours, a super-Earth's heavier blanket, a runaway greenhouse, a cold nitrogen haze, a giant's hydrogen, rock vapour
// over lava, or the steam of an ocean world.
export const airFor = (random: RandomSource, recipe: AirRecipe, temperatureC: number): AirData | null => {
  switch (recipe) {
    case "thin":
      return random() < 0.6
        ? { kind: "thin", pressureBar: randomBetween(random, 0.004, 0.2), temperatureC, topTemperatureC: temperatureC - 60, molarMass: GAS.carbonDioxide }
        : null;
    case "earthlike":
      return {
        kind: "thick", pressureBar: randomBetween(random, 0.5, 3), temperatureC: temperatureC + randomBetween(random, 5, 33), topTemperatureC: temperatureC - 70,
        molarMass: GAS.nitrogen,
      };
    case "thick":
      return {
        kind: "thick", pressureBar: randomBetween(random, 2, 12), temperatureC: temperatureC + randomBetween(random, 20, 70), topTemperatureC: temperatureC - 60,
        molarMass: GAS.nitrogen,
      };
    case "greenhouse":
      return {
        kind: "thick", pressureBar: randomBetween(random, 8, 120), temperatureC: temperatureC + randomBetween(random, 150, 420), topTemperatureC: temperatureC - 50,
        molarMass: GAS.carbonDioxide,
      };
    case "titan":
      return {
        kind: "thick", pressureBar: randomBetween(random, 0.8, 3), temperatureC: temperatureC + randomBetween(random, 0, 12), topTemperatureC: temperatureC - 20,
        molarMass: GAS.nitrogen,
      };
    case "giant":
      return { kind: "giant", pressureBar: 1, temperatureC: temperatureC - 20, topTemperatureC: temperatureC - 60, molarMass: GAS.hydrogen };
    case "vapour":
      return {
        kind: "thin", pressureBar: randomBetween(random, 0.001, 0.05), temperatureC: temperatureC + 300, topTemperatureC: temperatureC, molarMass: GAS.rockVapour,
      };
    case "steam":
      return {
        kind: "thick", pressureBar: randomBetween(random, 1, 6), temperatureC: temperatureC + randomBetween(random, 15, 45), topTemperatureC: temperatureC - 60,
        molarMass: GAS.steam,
      };
    default:
      return null;
  }
};

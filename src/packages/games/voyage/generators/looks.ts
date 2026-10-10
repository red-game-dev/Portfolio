import { hslToHex } from "@/packages/graphics/colour";
import type { GlobeAtmosphere, GlobeLook } from "@/packages/graphics/globe";
import { pick, RandomSource, randomBetween } from "@/packages/math/random";

import { WORLD_CLASSES } from "../config/worlds";
import { AirData, SystemBody } from "../domain/content";
import { StarKind, WorldClass } from "../domain/universe";

type Palette = [string, string, string, string];

// The hue plants would take under each kind of star, as astrobiologists expect: green under a star like the Sun;
// red, purple or near black under a dim red dwarf, to drink every photon they can; orange and gold under an orange
// dwarf; blue green or yellow under a hot white or blue star, to shed what is too much.
const PLANT_HUES: Readonly<Partial<Record<StarKind, readonly number[]>>> = {
  brownDwarf: [330, 345, 0],
  red: [320, 340, 355, 10],
  orange: [25, 40, 60, 95],
  yellow: [95, 110, 125],
  white: [70, 160, 175],
  blue: [60, 170, 185],
};

const plantHue = (random: RandomSource, star: StarKind | null) => pick(random, PLANT_HUES[star ?? "yellow"] ?? [110]) ?? 110;

// Within `spread` either side of a hue.
const near = (random: RandomSource, hue: number, spread: number) => hue + (random() * 2 - 1) * spread;

// A gas giant's colour from the clouds its temperature allows, as Sudarsky classed them: below about -120 C,
// ammonia clouds in Jupiter's tans and oranges; up to about 30 C, bright white water clouds; warmer, no clouds at
// all and a clear azure sky. Hotter giants are hot Jupiters.
const giantPalette = (random: RandomSource, temperatureC: number): Palette => {
  if (temperatureC < -120) {
    const hue = randomBetween(random, 20, 42);

    return [hslToHex(hue, 0.45, 0.28), hslToHex(hue + 12, 0.5, 0.48), hslToHex(hue + 24, 0.45, 0.68), hslToHex(hue + 36, 0.35, 0.86)];
  }

  if (temperatureC < 30) {
    const hue = randomBetween(random, 30, 210);

    return [hslToHex(hue, 0.12, 0.56), hslToHex(hue, 0.1, 0.7), hslToHex(hue, 0.08, 0.83), "#fbfbfd"];
  }

  const hue = randomBetween(random, 205, 222);

  return [hslToHex(hue, 0.6, 0.28), hslToHex(hue - 3, 0.6, 0.44), hslToHex(hue - 6, 0.55, 0.6), hslToHex(hue - 9, 0.45, 0.76)];
};

// A world's palette, low to high, as that kind of world really looks, varied within what is real so no two are
// the same: seas and land coloured by the plants its star would grow, Mars reds and desert tans, Venus's yellow
// cloud, Titan's orange haze, a mini-Neptune's pale blue, Europa's ice scored with red brown, Io's sulphur, the
// black crust and glowing cracks of a lava world, the graphite of a carbon world, an iron world's metal grey.
const paletteFor = (random: RandomSource, kind: WorldClass, star: StarKind | null, temperatureC: number): Palette => {
  const plants = plantHue(random, star);

  switch (kind) {
    case "terran":
    case "superEarth": {
      const sea = near(random, 205, 12);

      const land = hslToHex(plants, randomBetween(random, 0.3, 0.5), randomBetween(random, 0.2, 0.32));

      return [hslToHex(sea, 0.65, 0.16), hslToHex(sea - 8, 0.6, 0.34), land, hslToHex(near(random, 35, 10), 0.25, 0.6)];
    }
    case "ocean": {
      const sea = near(random, 208, 10);

      return [hslToHex(sea, 0.7, 0.12), hslToHex(sea - 8, 0.65, 0.3), hslToHex(plants, 0.32, 0.3), hslToHex(near(random, 40, 8), 0.25, 0.62)];
    }
    case "eyeball":
      return [hslToHex(near(random, 205, 8), 0.7, 0.14), hslToHex(near(random, 195, 8), 0.6, 0.32), hslToHex(205, 0.15, 0.78), "#f4f7fa"];
    case "desert": {
      const hue = pick(random, [12, 22, 30, 38]) ?? 22;
      const grey = random() < 0.25 ? 0.15 : 0.5;

      return [hslToHex(hue, grey, 0.2), hslToHex(hue + 6, grey, 0.36), hslToHex(hue + 12, grey * 0.9, 0.52), hslToHex(hue + 18, grey * 0.7, 0.7)];
    }
    case "toxic": {
      const hue = near(random, 46, 10);

      return [hslToHex(hue, 0.45, 0.4), hslToHex(hue, 0.5, 0.58), hslToHex(hue + 4, 0.5, 0.72), hslToHex(hue + 8, 0.35, 0.86)];
    }
    case "haze": {
      const hue = near(random, 30, 8);

      return [hslToHex(hue, 0.6, 0.25), hslToHex(hue, 0.65, 0.4), hslToHex(hue + 5, 0.6, 0.55), hslToHex(hue + 10, 0.5, 0.7)];
    }
    case "miniNeptune": {
      const hue = randomBetween(random, 182, 216);

      return [hslToHex(hue, 0.35, 0.45), hslToHex(hue, 0.4, 0.6), hslToHex(hue, 0.35, 0.74), hslToHex(hue, 0.25, 0.88)];
    }
    case "puffy": {
      const hue = randomBetween(random, 18, 45);

      return [hslToHex(hue, 0.25, 0.55), hslToHex(hue, 0.25, 0.68), hslToHex(hue, 0.2, 0.8), hslToHex(hue, 0.12, 0.9)];
    }
    case "icy": {
      const ice = near(random, 205, 20);

      return [hslToHex(near(random, 22, 8), 0.35, 0.42), hslToHex(ice, 0.2, 0.74), hslToHex(ice, 0.12, 0.86), "#f6f8fa"];
    }
    case "volcanic":
      return [hslToHex(40, 0.45, 0.14), hslToHex(near(random, 50, 6), 0.75, 0.5), hslToHex(near(random, 56, 5), 0.75, 0.68), "#ff7a2a"];
    case "chthonian":
      return [hslToHex(15, 0.2, 0.08), hslToHex(20, 0.25, 0.2), hslToHex(25, 0.25, 0.32), "#ff5a1a"];
    case "lava":
      return ["#1a0f0c", "#3a1c12", "#6a2a14", "#ff6a1a"];
    case "carbon":
      return ["#0b0b0d", "#1c1c20", "#2e2c30", "#ff8a3a"];
    case "iron": {
      const hue = near(random, 30, 12);

      return [hslToHex(hue, 0.08, 0.25), hslToHex(hue, 0.08, 0.42), hslToHex(hue, 0.06, 0.6), hslToHex(hue, 0.05, 0.78)];
    }
    case "iceGiant": {
      const hue = random() < 0.5 ? near(random, 186, 6) : near(random, 220, 8);

      return [hslToHex(hue, 0.5, 0.3), hslToHex(hue + 4, 0.55, 0.48), hslToHex(hue + 8, 0.5, 0.62), hslToHex(hue + 12, 0.4, 0.82)];
    }
    case "gas":
      return giantPalette(random, temperatureC);
    case "hotJupiter":
      // Below about 1100 C, alkali metals make it darker than coal; hotter, silicate clouds glow orange.
      return temperatureC < 1100
        ? [hslToHex(230, 0.4, 0.08), hslToHex(240, 0.35, 0.16), hslToHex(260, 0.25, 0.24), "#ff5a2a"]
        : [hslToHex(15, 0.5, 0.2), hslToHex(20, 0.6, 0.35), hslToHex(30, 0.6, 0.5), "#ffb24a"];
    case "rogue":
      return ["#05070a", "#0d1218", "#1a222c", "#2e3a48"];
    default: {
      const hue = randomBetween(random, 0, 40);
      const saturation = randomBetween(random, 0.06, 0.16);

      return [hslToHex(hue, saturation, 0.2), hslToHex(hue, saturation, 0.36), hslToHex(hue, saturation * 0.9, 0.52), hslToHex(hue, saturation * 0.8, 0.72)];
    }
  }
};

// The colour its air glows at the limb: blue where nitrogen scatters sunlight, as ours does; white with steam;
// yellow over a greenhouse; Titan's orange haze; a giant's pale halo in its own colour.
const atmosphereFor = (random: RandomSource, kind: WorldClass, air: AirData, palette: Palette): GlobeAtmosphere => {
  const colour = kind === "toxic" ? hslToHex(48, 0.55, 0.72) : kind === "haze" ? hslToHex(30, 0.6, 0.6) : kind === "ocean" ? hslToHex(205, 0.45, 0.78)
    : air.kind === "giant" ? palette[2] : hslToHex(near(random, 210, 8), 0.6, 0.65);

  return {
    colour,
    thickness: air.kind === "giant" ? 0.03 : 0.07,
    density: Math.min(1, 0.4 + air.pressureBar / 30),
    sunset: hslToHex(near(random, 25, 12), 0.7, 0.55),
  };
};

// How a world of a kind looks on its globe: its recipe, a palette true to its kind and star, how much sea, how
// banded and turbulent, ice caps, clouds, air glowing at the limb, and rings.
export const lookFor = (random: RandomSource, kind: WorldClass, air: AirData | null, rings: SystemBody["rings"], seed: number, star: StarKind | null,
  temperatureC: number): GlobeLook => {
  const spec = WORLD_CLASSES[kind];
  const palette = paletteFor(random, kind, star, temperatureC);
  const isLiving = kind === "terran" || kind === "superEarth" || kind === "ocean";
  const look: GlobeLook = {
    surface: {
      kind: spec.surface,
      palette,
      seed,
      sea: kind === "ocean" ? randomBetween(random, 0.93, 0.99) : kind === "superEarth" ? randomBetween(random, 0.2, 0.5) : randomBetween(random, 0.45, 0.72),
      bands: random(),
      turbulence: random(),
      caps: isLiving ? randomBetween(random, 0.03, 0.25) : 0,
      glint: isLiving || kind === "eyeball",
    },
  };

  if (air && air.kind !== "thin") {
    look.atmosphere = atmosphereFor(random, kind, air, palette);
  }

  if (isLiving || kind === "eyeball") {
    look.clouds = kind === "ocean" ? randomBetween(random, 0.5, 0.85) : kind === "eyeball" ? randomBetween(random, 0.15, 0.35) : randomBetween(random, 0.3, 0.75);
    look.cloudDrift = randomBetween(random, 0.002, 0.008);
  }

  if (rings) {
    const isIcy = temperatureC < -150;

    look.rings = {
      inner: rings.inner,
      outer: rings.outer,
      colour: isIcy ? hslToHex(near(random, 210, 20), 0.1, 0.82) : hslToHex(near(random, 32, 10), 0.25, 0.68),
      opacity: randomBetween(random, 0.3, 0.8),
      seed,
    };
  }

  return look;
};

import { hexToRgb, mixRgb, Rgb, rgbToHex } from "@/packages/graphics/colour";
import type { GlobeLook } from "@/packages/graphics/globe";
import type { Air, Ground, Relief } from "@/packages/graphics/landscape";
import { angleBetween, RAD } from "@/packages/math/angles";
import { clamp, wrap } from "@/packages/math/clamp";

import { GROUND_BY_KIND, GroundPreset, GROUNDS, SKIES } from "../config/skies";
import { HOME_WORLD } from "../domain/content";

// Mars changes from place to place: dune fields, rolling plains, mountains.
const MARS_RELIEFS: readonly Relief[] = ["dunes", "hills", "mountains"];

// Where something stands in the sky for someone on a world: `up` is the world angle straight up from the spot,
// `towards` the angle from the world's centre to the thing. Overhead when they agree, on the horizon a quarter
// turn off, below it beyond; and how far across the view it sits, from -0.9 (one edge) to 0.9 (the other).
export const skyPlace = (up: number, towards: number): { elevation: number; side: number } => {
  const offset = angleBetween(up, towards);

  return { elevation: 90 - Math.abs(offset) * RAD, side: Math.sign(offset) * Math.min(1, Math.abs(offset) / (Math.PI / 2)) * 0.9 };
};

// The local solar time at the spot: noon with the star overhead, six with it on one horizon, eighteen on the other.
export const solarHours = (up: number, towardsStar: number): number => wrap(12 + (angleBetween(up, towardsStar) * RAD) / 15, 24);

// How much of something in the sky is lit, seen from the ground, and from which side: full opposite the star,
// new beside it.
export const phaseOf = (towards: number, towardsStar: number): { lit: number; lightSide: number } => {
  const apart = angleBetween(towards, towardsStar);

  return { lit: (1 - Math.cos(apart)) / 2, lightSide: apart > 0 ? 1 : -1 };
};

const darker = (colour: Rgb, share: number) => rgbToHex(mixRgb(colour, [0, 0, 0], share));

// Earth's ground from the colour of its map where the ship set down: sea blue is ocean (a splashdown), near white
// is ice, green is forest where dark and grassland where light, warm sand is desert, anything else is rock. With
// no map yet, ice towards the poles and grassland elsewhere.
export const earthGround = (sample: Rgb | null, latitude: number): GroundPreset => {
  if (!sample) {
    return Math.abs(latitude) > 66 ? { biome: "ice", relief: "ice", colour: "#eef3f8", far: "#b9cfe0", hasRocks: false } : GROUNDS.earth;
  }

  const [red, green, blue] = sample;
  const colour = rgbToHex(sample);
  const far = darker(sample, 0.3);

  if (blue > red + 15 && blue >= green - 5 && red + green + blue < 450) {
    return { biome: "ocean", relief: "sea", colour: darker(sample, 0.25), far: colour, hasRocks: false };
  }

  if (red > 195 && green > 195 && blue > 195) {
    return { biome: "ice", relief: "ice", colour, far, hasRocks: false };
  }

  if (green >= red && green >= blue) {
    return green < 90 ? { biome: "forest", relief: "forest", colour, far, hasRocks: false } : { biome: "grassland", relief: "hills", colour, far, hasRocks: false };
  }

  if (red > green && green > blue && red > 140) {
    return { biome: "desert", relief: "dunes", colour, far, hasRocks: false };
  }

  return { biome: "rock", relief: "mountains", colour, far, hasRocks: true };
};

// A spot's own number from where it is, the same each time, for choosing among kinds of ground.
const spotHash = (latitude: number, longitude: number) => Math.abs(Math.floor((longitude + 180) * 3.7 + (latitude + 90) * 1.3)) % 97;

// The ground where the ship set down: Earth's read from its map; the other worlds of ours from what they are, in
// the colour of their map at that spot where there is one (Mars's polar caps are ice, Titan's poles its methane
// seas, Mars and Pluto vary from place to place); a world a universe made from the recipe of its globe and its
// palette, its terran worlds sometimes sea.
export const groundAt = (id: string, look: GlobeLook | undefined, sample: Rgb | null, latitude: number, longitude: number, isHome: boolean): GroundPreset => {
  const hash = spotHash(latitude, longitude);

  if (isHome && id === HOME_WORLD) {
    return earthGround(sample, latitude);
  }

  if (isHome && GROUNDS[id]) {
    const preset = GROUNDS[id];
    const tinted = sample ? { colour: rgbToHex(sample), far: darker(sample, 0.32) } : {};

    if (id === "mars" && Math.abs(latitude) > 78) {
      return { biome: "ice", relief: "ice", colour: "#ebe6dd", far: "#b8aea2", hasRocks: false };
    }

    if (id === "titan" && Math.abs(latitude) > 55) {
      return { biome: "methaneSea", relief: "sea", colour: "#241c12", far: "#3a2c1c", hasRocks: false };
    }

    if (id === "mars") {
      return { ...preset, ...tinted, relief: MARS_RELIEFS[hash % MARS_RELIEFS.length] };
    }

    if (id === "pluto") {
      return { ...preset, ...tinted, relief: hash % 2 === 0 ? "mountains" : "ice" };
    }

    return { ...preset, ...tinted };
  }

  const kind = look?.surface.kind ?? "rocky";
  const palette = look?.surface.palette ?? ["#3a3430", "#6a5e52", "#958676", "#c8bba8"];
  const preset = GROUND_BY_KIND[kind];

  if (kind === "terran" && hash / 97 < (look?.surface.sea ?? 0.5)) {
    return { biome: "ocean", relief: "sea", colour: darker(hexToRgb(palette[0]), 0.2), far: palette[1], hasRocks: false };
  }

  return { ...preset, colour: palette[1], far: palette[0] };
};

// A world's sky from its ground: ours as they really look; a made world's from its air's colour, thicker and
// hazier the more air it has.
export const airFor = (id: string, look: GlobeLook | undefined, pressureBar: number | null, isHome: boolean): Air | null => {
  if (isHome) {
    return SKIES[id] ?? null;
  }

  if (pressureBar === null || pressureBar < 0.005) {
    return null;
  }

  const tint = hexToRgb(look?.atmosphere?.colour ?? look?.surface.palette[2] ?? "#8aa4d6");
  const strength = clamp(Math.log10(1 + pressureBar * 100) / 2, 0.15, 1);

  return {
    zenith: rgbToHex(mixRgb(tint, [0, 0, 0], 0.35)),
    horizon: rgbToHex(mixRgb(tint, [255, 255, 255], 0.35)),
    dusk: rgbToHex(mixRgb(tint, [255, 130, 60], 0.55)),
    night: rgbToHex(mixRgb(tint, [0, 0, 0], 0.9)),
    strength,
    haze: pressureBar > 10 ? 0.9 : pressureBar > 3 ? 0.5 : 0,
  };
};

// The ground as the landscape painter takes it, seeded from the spot so the same place looks the same.
export const toGround = (preset: GroundPreset, latitude: number, longitude: number): Ground => ({
  relief: preset.relief,
  colour: preset.colour,
  far: preset.far,
  hasRocks: preset.hasRocks,
  seed: spotHash(latitude, longitude) + 1,
});

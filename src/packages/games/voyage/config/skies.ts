import type { SurfaceKind } from "@/packages/graphics/globe";
import type { Air, Relief } from "@/packages/graphics/landscape";

import { SurfaceBiome } from "../domain/surface";

// The ground of a kind of world where no map says otherwise: its biome, its shape, its colour near by and far
// off, and whether boulders lie about.
export interface GroundPreset {
  biome: SurfaceBiome;
  relief: Relief;
  colour: string;
  far: string;
  hasRocks: boolean;
}

// The skies of the worlds with air, as seen from their ground: Earth's blue; Mars's butterscotch by day with its
// blue sunset; Venus's yellow murk, its Sun never seen as a disc; Titan's orange haze; the thin blue haze layers
// of Triton and Pluto. Every other world of ours has no air worth the name: a black sky.
export const SKIES: Readonly<Record<string, Air>> = {
  earth: { zenith: "#3b7bd0", horizon: "#b5d5f2", dusk: "#ff8d4d", night: "#0b1631", strength: 1, haze: 0 },
  mars: { zenith: "#c49a72", horizon: "#e0c19b", dusk: "#6f8fc2", night: "#0d0906", strength: 0.6, haze: 0.18 },
  venus: { zenith: "#c18a3a", horizon: "#e2b15c", dusk: "#9a5a26", night: "#160a04", strength: 1, haze: 1 },
  titan: { zenith: "#9c6a2a", horizon: "#cf9a52", dusk: "#6e4318", night: "#0d0703", strength: 0.9, haze: 0.9 },
  triton: { zenith: "#0a1020", horizon: "#3b5b8c", dusk: "#5a78b0", night: "#020308", strength: 0.18, haze: 0.04 },
  pluto: { zenith: "#0a1020", horizon: "#3a5c92", dusk: "#5c7cb4", night: "#020308", strength: 0.18, haze: 0.04 },
};

// The ground of each world of ours that can be stood on. Earth's is read from its map where the ship sets down.
export const GROUNDS: Readonly<Record<string, GroundPreset>> = {
  mercury: { biome: "regolith", relief: "craters", colour: "#8a7f74", far: "#5c544c", hasRocks: true },
  venus: { biome: "basalt", relief: "flat", colour: "#7a5634", far: "#4d3520", hasRocks: true },
  earth: { biome: "grassland", relief: "hills", colour: "#5f7f45", far: "#3f5d3e", hasRocks: false },
  moon: { biome: "regolith", relief: "craters", colour: "#8e8c88", far: "#5e5c59", hasRocks: true },
  mars: { biome: "dust", relief: "hills", colour: "#b0603a", far: "#7d4127", hasRocks: true },
  io: { biome: "sulfur", relief: "mountains", colour: "#d6be52", far: "#9a7c2c", hasRocks: false },
  europa: { biome: "iceCrust", relief: "ice", colour: "#ddd6c8", far: "#a8988a", hasRocks: false },
  ganymede: { biome: "regolith", relief: "craters", colour: "#8f8476", far: "#5e554b", hasRocks: true },
  callisto: { biome: "regolith", relief: "craters", colour: "#6f6253", far: "#463d33", hasRocks: true },
  titan: { biome: "dunes", relief: "dunes", colour: "#6a4a28", far: "#4a331c", hasRocks: false },
  triton: { biome: "nitrogenIce", relief: "ice", colour: "#d9c6c0", far: "#a08880", hasRocks: false },
  pluto: { biome: "nitrogenIce", relief: "mountains", colour: "#e2cfbd", far: "#a28470", hasRocks: false },
  charon: { biome: "regolith", relief: "craters", colour: "#857c78", far: "#575150", hasRocks: true },
};

// The ground of a world a universe made, from the recipe its globe is painted with.
export const GROUND_BY_KIND: Readonly<Record<SurfaceKind, Pick<GroundPreset, "biome" | "relief" | "hasRocks">>> = {
  rocky: { biome: "rock", relief: "hills", hasRocks: true },
  cratered: { biome: "regolith", relief: "craters", hasRocks: true },
  icy: { biome: "iceCrust", relief: "ice", hasRocks: false },
  volcanic: { biome: "sulfur", relief: "mountains", hasRocks: false },
  terran: { biome: "grassland", relief: "hills", hasRocks: false },
  desert: { biome: "desert", relief: "dunes", hasRocks: false },
  lava: { biome: "lava", relief: "flat", hasRocks: true },
  gas: { biome: "rock", relief: "flat", hasRocks: false },
  iceGiant: { biome: "ice", relief: "flat", hasRocks: false },
  haze: { biome: "dunes", relief: "dunes", hasRocks: false },
  toxic: { biome: "basalt", relief: "flat", hasRocks: true },
  rogue: { biome: "ice", relief: "ice", hasRocks: false },
};

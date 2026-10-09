import { VoyageRouteStop, VoyageStyle } from "../domain/types";

export interface VoyageScoring {
  // Per world unit flown.
  perUnit: number;
  pickup: number;
  // For every universe reached, the first included.
  universe: number;
}

export interface VoyageConfig {
  framesPerSecond: number;
  maxStepMs: number;
  // Earth to Pluto. Distance grows with the square of time, so the inner planets are not crowded together
  // and the outer ones still come round before the run drags.
  solarMs: number;
  route: VoyageRouteStop[];
  // How fast space streams past, in world units a second: through the solar system, then in the universes,
  // where it speeds up by `speedGrowth` a minute to `maxSpeed`.
  solarSpeed: number;
  universeSpeed: number;
  speedGrowth: number;
  maxSpeed: number;
  shipRadius: number;
  shipSpeed: number;
  shields: number;
  invulnerableMs: number;
  // Between hazards in open space, when a universe begins, and at the fastest the universes get.
  hazardEveryMs: number;
  universeHazardEveryMs: number;
  minHazardEveryMs: number;
  pickupEveryMs: number;
  shieldEveryMs: number;
  // A black hole in the universes comes round every so often, somewhere in this range.
  holeEveryMs: [number, number];
  holeRadius: number;
  holePull: number;
  // Past Pluto: the singularity's size, how long until it takes the ship whatever it does, and how long the
  // ship is lost inside it. Later black holes are crossed faster.
  singularityRadius: number;
  singularityMs: number;
  captureMs: number;
  lostMs: number;
  jumpMs: number;
  scoring: VoyageScoring;
  // How many universes there are on the other side.
  universes: number;
}

export type VoyageConfigOverrides = Partial<VoyageConfig>;

// The way out, by distance from the Sun (semi-major axes, rounded). The Moon is passed almost at once.
export const SOLAR_ROUTE: VoyageRouteStop[] = [
  { id: "moon", au: 1.003, radius: 0.075, side: 1, inset: 1.9 },
  { id: "mars", au: 1.52, radius: 0.1, side: -1, inset: 1.7 },
  { id: "belt", au: 2.2, until: 3.2, every: 300, radius: 0, side: 1, inset: 0 },
  { id: "jupiter", au: 5.2, radius: 0.48, side: 1, inset: 0.45 },
  { id: "saturn", au: 9.54, radius: 0.3, side: -1, inset: 0.75 },
  { id: "uranus", au: 19.19, radius: 0.17, side: 1, inset: 1.15 },
  { id: "neptune", au: 30.07, radius: 0.17, side: -1, inset: 1.15 },
  { id: "kuiper", au: 30.5, until: 38.6, every: 650, radius: 0, side: 1, inset: 0 },
  { id: "pluto", au: 39.48, radius: 0.06, side: 1, inset: 2.2 },
];

export const DEFAULT_VOYAGE_CONFIG: VoyageConfig = {
  framesPerSecond: 60,
  maxStepMs: 50,
  solarMs: 62000,
  route: SOLAR_ROUTE,
  solarSpeed: 0.36,
  universeSpeed: 0.46,
  speedGrowth: 0.09,
  maxSpeed: 0.95,
  shipRadius: 0.036,
  shipSpeed: 1.15,
  shields: 3,
  invulnerableMs: 1400,
  hazardEveryMs: 1900,
  universeHazardEveryMs: 900,
  minHazardEveryMs: 380,
  pickupEveryMs: 1700,
  shieldEveryMs: 21000,
  holeEveryMs: [13000, 23000],
  holeRadius: 0.055,
  holePull: 0.011,
  singularityRadius: 0.13,
  singularityMs: 7000,
  captureMs: 1100,
  lostMs: 3200,
  jumpMs: 1500,
  scoring: { perUnit: 10, pickup: 25, universe: 500 },
  universes: 5,
};

export const resolveVoyageConfig = (overrides: VoyageConfigOverrides = {}): VoyageConfig => ({ ...DEFAULT_VOYAGE_CONFIG, ...overrides });

export interface VoyageUniverseTheme {
  style: VoyageStyle;
  // The universe's own colour, the deep it is set in, and what drifts through it.
  accent: string;
  deep: string;
  hazard: string;
}

export interface VoyageTheme {
  space: string;
  star: string;
  sun: string;
  hull: string;
  hullShade: string;
  window: string;
  fin: string;
  flameCore: string;
  flameEdge: string;
  shield: string;
  danger: string;
  disk: string;
  diskHot: string;
  universes: VoyageUniverseTheme[];
}

export const DEFAULT_VOYAGE_THEME: VoyageTheme = {
  space: "#03050c",
  star: "#ecf1ff",
  sun: "rgba(255, 196, 92, 0.55)",
  hull: "#eef1f8",
  hullShade: "#9aa3bb",
  window: "#c4d2ff",
  fin: "#3e4a6b",
  flameCore: "#fff6df",
  flameEdge: "#ffb03a",
  shield: "#4fd8ff",
  danger: "#ff4d5e",
  disk: "#ff8a3d",
  diskHot: "#fff1c9",
  universes: [
    { style: "matrix", accent: "#4bffa5", deep: "#020a06", hazard: "#ff4d5e" },
    { style: "neural", accent: "#4fd8ff", deep: "#020812", hazard: "#d17bff" },
    { style: "blocks", accent: "#b896ff", deep: "#07040f", hazard: "#b896ff" },
    { style: "chips", accent: "#ff5fa2", deep: "#0f0309", hazard: "#ff5fa2" },
    { style: "pixels", accent: "#ffc45c", deep: "#0c0802", hazard: "#ffc45c" },
  ],
};

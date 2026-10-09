import { VoyageStyle } from "../domain/theme";
import { RouteLayout } from "../mappers/RouteMapper";

export interface ShipConfig {
  radius: number;
  mass: number;
  hull: number;
  shields: number;
  // Shield points back per second, after `shieldDelayMs` without a hit.
  shieldRegen: number;
  shieldDelayMs: number;
  fuel: number;
  // Fuel per second at full thrust.
  burn: number;
  // World units per second squared at full thrust, and when braking against the velocity.
  thrust: number;
  brake: number;
  // Radians per second the ship can turn.
  turnRate: number;
  // Inertial dampers: velocity bled per second, so the ship stays flyable. Space itself has no drag.
  dampers: number;
  maxSpeed: number;
}

export interface FlightConfig {
  // Slower than this, touching a rocky surface is a landing; faster is a crash.
  safeLanding: number;
  // Hull damage per (speed over safe)^2 on a crash.
  crash: number;
  drag: number;
  heating: number;
  cooling: number;
  // Hull damage per second while heat is over 1.
  overheat: number;
  // Hull damage per second at full depth below a giant's one bar level, and the depth (as a share of its
  // radius) where the hull gives out.
  crush: number;
  crushDepth: number;
  // Fuel scooped per second while skimming a giant's upper air.
  skim: number;
  // Hull damage per unit of rock radius per (relative speed)^2.
  impact: number;
}

export interface SpawnConfig {
  // Rocks kept round the ship in open space, in a belt (scaled by its density) and in the universes.
  open: number;
  belt: number;
  universe: number;
  // Extra rocks in the universes per minute spent in them.
  universeGrowth: number;
  minRadius: number;
  maxRadius: number;
  pickups: number;
}

export interface HoleConfig {
  singularityMu: number;
  // How fast the singularity's pull grows once Pluto is behind, as a share of itself per second.
  singularityGrowth: number;
  singularityHorizon: number;
  mu: number;
  horizon: number;
  // Black holes kept round the ship in each universe, and how far away they appear.
  perUniverse: number;
  spawnDistance: [number, number];
  captureMs: number;
  lostMs: number;
  jumpMs: number;
}

export interface PickupConfig {
  score: number;
  repair: number;
  shield: number;
  fuel: number;
}

export interface ScoringConfig {
  perUnit: number;
  pickup: number;
  universe: number;
  landing: number;
  discovery: number;
}

export interface UnitsConfig {
  // Real km/s per world unit per second, so cruise reads like a real deep space probe.
  kmPerSecond: number;
  // Real km between bodies come from their distance from the Sun.
  kmPerAu: number;
}

export interface VoyageConfig {
  framesPerSecond: number;
  stepMs: number;
  maxSteps: number;
  layout: RouteLayout;
  ship: ShipConfig;
  flight: FlightConfig;
  spawn: SpawnConfig;
  holes: HoleConfig;
  pickups: PickupConfig;
  scoring: ScoringConfig;
  units: UnitsConfig;
  universes: number;
  // The solar system is the warm up: the hull cannot fail there, so every reader reaches the black hole.
  isSolarSafe: boolean;
}

export type VoyageConfigOverrides = Partial<VoyageConfig>;

export const DEFAULT_VOYAGE_CONFIG: VoyageConfig = {
  framesPerSecond: 120,
  stepMs: 1000 / 120,
  maxSteps: 10,
  layout: { length: 120, earthRadius: 0.35, radiusExponent: 0.45, gravityScale: 0.09, spread: 6 },
  ship: {
    radius: 0.06,
    mass: 1,
    hull: 1000,
    shields: 400,
    shieldRegen: 80,
    shieldDelayMs: 2500,
    fuel: 100,
    burn: 1.1,
    thrust: 1.5,
    brake: 1.2,
    turnRate: 5.5,
    dampers: 0.22,
    maxSpeed: 3.2,
  },
  flight: { safeLanding: 0.42, crash: 520, drag: 0.8, heating: 0.06, cooling: 0.35, overheat: 140, crush: 900, crushDepth: 0.86, skim: 12, impact: 70 },
  spawn: { open: 5, belt: 28, universe: 13, universeGrowth: 4, minRadius: 0.04, maxRadius: 0.13, pickups: 5 },
  holes: {
    singularityMu: 4,
    singularityGrowth: 1.2,
    singularityHorizon: 0.9,
    mu: 1.6,
    horizon: 0.32,
    perUniverse: 2,
    spawnDistance: [6, 11],
    captureMs: 2400,
    lostMs: 3200,
    jumpMs: 1600,
  },
  pickups: { score: 25, repair: 150, shield: 200, fuel: 35 },
  scoring: { perUnit: 6, pickup: 25, universe: 500, landing: 150, discovery: 100 },
  units: { kmPerSecond: 7, kmPerAu: 149597870.7 },
  universes: 5,
  isSolarSafe: true,
};

export const resolveVoyageConfig = (overrides: VoyageConfigOverrides = {}): VoyageConfig => ({ ...DEFAULT_VOYAGE_CONFIG, ...overrides });

export interface VoyageUniverseTheme {
  style: VoyageStyle;
  accent: string;
  deep: string;
  hazard: string;
}

export interface VoyageTheme {
  space: string;
  star: string;
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

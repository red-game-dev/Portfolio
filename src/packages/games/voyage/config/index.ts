import type { GlobeLook, StarLook } from "@/packages/graphics/globe";

import { ModuleId } from "../domain/components";
import { VoyageStyle } from "../domain/theme";
import { SystemLayout } from "../mappers/SystemMapper";
import { BODY_LOOKS, SUN_LOOK } from "./looks";

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
  // Slower than this (against the ground), touching a rocky surface is a landing; faster is a crash.
  safeLanding: number;
  // Hull damage per (speed over safe)^2 on a crash.
  crash: number;
  drag: number;
  // Hull damage per second at twice the pressure the hull is built for.
  crush: number;
  // Fuel scooped per second while skimming a giant's upper air.
  skim: number;
  // Hull damage per unit of rock radius per (relative speed)^2.
  impact: number;
}

export interface ThermalConfig {
  // Seconds for the hull to close most of the gap to the temperature of its surroundings.
  timeConstant: number;
  // Kelvin per second of entry heating, per unit of air density times speed cubed.
  entry: number;
  // The temperature (Celsius) each system is built for; past it, it starts to fail.
  ratings: Record<ModuleId, number>;
  // Integrity a system loses per second at twice its rating.
  wear: number;
  // Hull lost per second as the plating melts, at twice its rating.
  melt: number;
  // Fuel boils off above this temperature (Celsius), this much a second for each 100 degrees past it.
  boilOffC: number;
  boilOff: number;
  // The pressure (bar) the hull is built for.
  pressureBar: number;
}

// The star's weather: how often it flares (seconds), how fast and wide its storms spread, how often one heads
// for the ship, and what a storm of full strength does to the shields, the sensors and the radiation count.
export interface WeatherConfig {
  every: [number, number];
  speed: [number, number];
  width: [number, number];
  heading: number;
  drain: number;
  sensors: number;
  radiation: number;
  auroraFade: number;
}

// The ship's gun: what it fires and how, and how far it reaches.
export interface ArmsConfig {
  kind: "cannon" | "laser";
  damage: number;
  rate: number;
  range: number;
  speed: number;
  heat: number;
  // A rock is shot down when it would hit within this many seconds.
  threatSeconds: number;
}

// Who lives in the universes: how many groups round the ship (more as danger grows), how far out they appear,
// and when the universe's boss shows itself (seconds there).
export interface LifeConfig {
  packs: number;
  packsPerDanger: number;
  spawnDistance: [number, number];
  bossAfter: number;
}

// Rocks headed for worlds: how often (seconds), how fast, their real sizes in the solar system and in the
// universes (km), and the share of the universes' that are whole planetoids.
export interface ImpactConfig {
  every: [number, number];
  speed: [number, number];
  solarKm: [number, number];
  universeKm: [number, number];
  planetoid: number;
}

// Wrecks: how often a derelict drifts by (seconds) and how many at once; how near the ship must hold (world
// units between hulls), how slowly it must close for the tractor beam to take hold and how fast the beam then
// matches their speeds (a share a second), and how closely they must match to salvage; how long each kind takes
// (seconds); and how often a rock or a comet shot apart leaves something worth taking.
export interface SalvageConfig {
  every: [number, number];
  max: number;
  reach: number;
  engage: number;
  beam: number;
  match: number;
  seconds: Record<"probe" | "rocket" | "starship" | "alien" | "ore" | "ice", number>;
  debris: number;
}

// Breakdowns: the chance a second of each system breaking down when sound, how much likelier as it wears, runs
// hot or flies in the universes, how many at once, and what each does at its worst: thrust lost to a misfire
// (share of the time), fuel leaked a second, heat a leaking coolant loop adds a second (Celsius), how wide
// glitching sensors make the guns aim (radians), shield recharge lost, and hull a breach bleeds a second.
export interface FaultConfig {
  rate: number;
  wearFactor: number;
  heatFactor: number;
  universeFactor: number;
  max: number;
  misfire: number;
  leak: number;
  coolant: number;
  aim: number;
  emitter: number;
  breach: number;
}

export interface ClockConfig {
  // Mission hours that pass for each second flown.
  hoursPerSecond: number;
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
  // Seconds between comets falling in from the dark, in the solar system.
  cometEvery: [number, number];
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
  layout: SystemLayout;
  clock: ClockConfig;
  ship: ShipConfig;
  flight: FlightConfig;
  thermal: ThermalConfig;
  weather: WeatherConfig;
  arms: ArmsConfig;
  life: LifeConfig;
  impacts: ImpactConfig;
  // Seconds between ships passing.
  traffic: [number, number];
  salvage: SalvageConfig;
  faults: FaultConfig;
  spawn: SpawnConfig;
  holes: HoleConfig;
  pickups: PickupConfig;
  scoring: ScoringConfig;
  units: UnitsConfig;
  universes: number;
  // The solar system is the warm up: rocks, crashes, entry and crushing cannot finish the hull there, so every
  // reader reaches the black hole. The Sun is the exception: fly into it and the ship melts.
  isSolarSafe: boolean;
}

export type VoyageConfigOverrides = Partial<VoyageConfig>;

export const DEFAULT_VOYAGE_CONFIG: VoyageConfig = {
  framesPerSecond: 120,
  stepMs: 1000 / 120,
  maxSteps: 10,
  layout: { unitsPerRootAu: 20, earthRadius: 0.35, radiusExponent: 0.45, gravityScale: 0.09, starSurfaceAcceleration: 1.1 },
  clock: { hoursPerSecond: 0.5 },
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
  flight: { safeLanding: 0.42, crash: 520, drag: 0.8, crush: 600, skim: 12, impact: 70 },
  thermal: {
    timeConstant: 3,
    entry: 120,
    ratings: { hull: 600, engines: 900, shields: 200, sensors: 125, fuel: 400, radiators: 350 },
    wear: 0.45,
    melt: 160,
    boilOffC: 90,
    boilOff: 3,
    pressureBar: 50,
  },
  weather: { every: [55, 120], speed: [0.45, 1.2], width: [0.6, 1.5], heading: 0.45, drain: 280, sensors: 0.2, radiation: 60000, auroraFade: 0.05 },
  arms: { kind: "cannon", damage: 32, rate: 3.2, range: 6.5, speed: 7, heat: 3, threatSeconds: 1.6 },
  life: { packs: 2, packsPerDanger: 1, spawnDistance: [9, 16], bossAfter: 45 },
  impacts: { every: [70, 150], speed: [0.7, 1.2], solarKm: [0.5, 15], universeKm: [200, 3500], planetoid: 0.3 },
  traffic: [25, 60],
  salvage: {
    every: [35, 80],
    max: 3,
    reach: 0.4,
    engage: 0.7,
    beam: 3,
    match: 0.22,
    seconds: { probe: 1.6, rocket: 2.2, starship: 3.2, alien: 2, ore: 0.5, ice: 0.6 },
    debris: 0.3,
  },
  faults: { rate: 1 / 900, wearFactor: 5, heatFactor: 4, universeFactor: 1.6, max: 3, misfire: 0.45, leak: 1.2, coolant: 30, aim: 0.22, emitter: 0.85, breach: 4 },
  spawn: { open: 5, belt: 28, universe: 13, universeGrowth: 4, minRadius: 0.04, maxRadius: 0.13, pickups: 5, cometEvery: [45, 100] },
  holes: {
    singularityMu: 4,
    singularityGrowth: 1.2,
    singularityHorizon: 0.42,
    mu: 1.6,
    horizon: 0.24,
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
  // How each body and the Sun look (see looks.ts).
  bodies: Record<string, GlobeLook>;
  sun: StarLook;
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
  bodies: BODY_LOOKS,
  sun: SUN_LOOK,
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

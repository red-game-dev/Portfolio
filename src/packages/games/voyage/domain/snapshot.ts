import { AlienRole, Modules } from "./components";
import { VoyagePhase } from "./events";
import { VoyageStatus } from "./state";
import { Disposition } from "./universe";

// Someone shown in an MMO frame: what they are called, their level, how they stand towards the ship, and how
// much hull and shield they have left.
export interface Frame {
  name: string;
  level: number;
  disposition: Disposition | null;
  role: AlienRole | null;
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
}

// A rock on its way to a world: which (its name), how big (km), how long until it hits, how strong it still is.
export interface IncomingRock {
  target: string;
  diameterKm: number;
  seconds: number;
  hp: number;
  maxHp: number;
  isOnCourse: boolean;
}

// The readings in real units, rounded for reading, never for maths.
export interface Telemetry {
  // m/s^2 from everything pulling, and what pulls hardest.
  gravity: number;
  dominant: string | null;
  // km above the surface (or one bar level) of the body pulling hardest, while near one.
  altitudeKm: number | null;
  speedKmS: number;
  // Distance from the Sun; null in the universes.
  au: number | null;
  pressureBar: number | null;
  hullTemperatureC: number;
  // The temperature outside, sunlight in W/m^2 and radiation in microsieverts an hour.
  outsideC: number;
  sunlight: number | null;
  radiation: number;
  // How much slower the ship's clock runs than one far from any black hole.
  timeDilation: number;
  // The mission clock, as a real moment (ms since 1970).
  missionTime: number;
}

// What a UI shows between frames. Changes a few times a second at most.
export interface VoyageSnapshot {
  status: VoyageStatus;
  phase: VoyagePhase;
  universe: number;
  universes: number;
  // The universe's own name, once there.
  universeName: string | null;
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  fuel: number;
  maxFuel: number;
  score: number;
  passing: string | null;
  landedOn: string | null;
  // Each system's integrity, in hundredths.
  modules: Modules;
  // The compass's target, its name where it was made up, and its real distance in km.
  waypoint: { id: string; name: string | null; distanceKm: number } | null;
  // What the guns are locked on, the universe's boss once it shows itself, whether the guns fire by themselves,
  // and the nearest rock headed for a world.
  target: Frame | null;
  boss: Frame | null;
  autoFire: boolean;
  incoming: IncomingRock | null;
  telemetry: Telemetry;
}

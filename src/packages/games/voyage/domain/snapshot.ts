import type { LandingMethod, LandingPhase } from "../landing";
import { AlienRole, Modules, WreckKind } from "./components";
import { VoyagePhase } from "./events";
import { FaultKind } from "./faults";
import { VoyageStatus } from "./state";
import { SurfaceInfo } from "./surface";
import { Disposition, GalaxyKind, StarKind } from "./universe";

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
  // Distance from the Sun; null in the universes. How many AU further out the black hole waits, until it wakes.
  au: number | null;
  toHoleAu: number | null;
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

// A landing on its way down, in real units: how it comes down and what it is doing now, how high (m), how fast (m/s,
// and how fast falling), the load the crew feels (Earth g), how hard the air heats it (about 1 at a capsule's peak),
// the throttle, whether a pilot could fly the burn and whether one is, their seconds of burn left, the speed the
// craft takes at touchdown, and how many times faster than life it is playing.
export interface DescentView {
  method: LandingMethod;
  phase: LandingPhase;
  altitude: number;
  speed: number;
  fall: number;
  load: number;
  heating: number;
  throttle: number;
  canFly: boolean;
  isPilot: boolean;
  reserve: number;
  safeSpeed: number;
  pace: number;
}

// What a UI shows between frames. Changes a few times a second at most.
export interface VoyageSnapshot {
  status: VoyageStatus;
  phase: VoyagePhase;
  universe: number;
  universes: number;
  // The universe's own name, once there, and the galaxy and star it holds.
  universeName: string | null;
  cosmos: { galaxy: GalaxyKind; star: StarKind | null; companions: StarKind[] } | null;
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  fuel: number;
  maxFuel: number;
  score: number;
  passing: string | null;
  landedOn: string | null;
  // Where the ship stands on that world, once its surface is in view, and the way down while it is coming down.
  surface: SurfaceInfo | null;
  descent: DescentView | null;
  // A crew coming home: being picked up, or at the pad days later.
  homecoming: { stage: "recovery" | "pad"; days: number; isSea: boolean } | null;
  // Who lives on the world the ship is coming down to or stands on, and how they meet visitors.
  people: { name: string; disposition: Disposition } | null;
  // A maze universe: the system the ship is in, how many there are and have been reached, and whether this one holds
  // the way on.
  maze: { system: string; systems: number; explored: number; isExit: boolean } | null;
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
  // The ship's level; the faults on board, oldest first; the wreck being salvaged and how far (0 to 1).
  level: number;
  faults: Array<{ id: number; kind: FaultKind }>;
  salvage: { kind: WreckKind; progress: number } | null;
  telemetry: Telemetry;
}

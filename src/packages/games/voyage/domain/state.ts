import type { Entity } from "@/packages/games/engine";

import { StarSystem } from "./content";
import { VoyagePhase } from "./events";
import { UniverseSpec } from "./universe";

export type VoyageStatus = "ready" | "flying" | "over";

// The ship being taken: it spirals into the hole at `centre` from `from` away as `progress` runs to 1.
export interface Capture {
  centre: { x: number; y: number };
  angle: number;
  from: number;
  progress: number;
  hole: Entity;
}

// Where the compass points, and what it is.
export interface Waypoint {
  id: string;
  x: number;
  y: number;
  // How big it is, in world units, so the compass marks only what is too small to see.
  radius: number;
}

// The mission clock: the real moment the run began, and how many hours pass for each second flown, so planets
// move round their orbits and turn at their true rates, faster than life.
export interface MissionClock {
  epochMs: number;
  hoursPerSecond: number;
}

// A storm thrown off by a flare: a shell of plasma racing out from the star across an arc of directions.
export interface Storm {
  angle: number;
  width: number;
  radius: number;
  speed: number;
  strength: number;
  // Whether it has reached the ship yet, and Earth, so each feels it once.
  hasHitShip: boolean;
  hasHitEarth: boolean;
}

// A scar left on a world by an impact: where (degrees), how wide (degrees of arc), and how hot it still glows.
export interface Crater {
  longitude: number;
  latitude: number;
  size: number;
  heat: number;
}

// What the strange things in a universe are doing now: a supernova's countdown and shock front, a gamma-ray
// burst's warning line, a pulsar's beam angle.
export interface PhenomenaState {
  supernova: { blowsAt: number; shock: number; hasHit: boolean; isWarned: boolean } | null;
  burst: { angle: number; x: number; y: number; firesAt: number } | null;
  nextBurstAt: number | null;
  pulsarAngle: number;
  // The dark forest's strike on its way; when the ship last went through a wormhole.
  strikeAt: number | null;
  jumpedAt: number;
}

// Readings taken while flying, for the telemetry the UI turns into real units.
export interface Readings {
  // m/s^2 from everything pulling, and what pulls hardest: a body's id, the star's, "singularity" or "hole".
  gravity: number;
  dominant: string | null;
  dominantDistance: number;
  density: number;
  pressureBar: number;
  // The body whose air the ship is in, and that air's temperature where the ship is (Celsius).
  airOf: string | null;
  airC: number | null;
  // Distance to the nearest black hole's centre over its horizon, for time dilation.
  holeRatio: number;
  // What the ship sits in: the temperature it is driven towards (Celsius), sunlight (W/m^2), radiation (uSv/h).
  environmentC: number;
  sunlight: number;
  radiation: number;
  // How hard tides pull the ship apart (world units per second squared across it), and how deep it is in a
  // nebula (0 to 1).
  tidal: number;
  nebula: number;
}

// Everything about a run that is not an entity.
export interface VoyageState {
  status: VoyageStatus;
  phase: VoyagePhase;
  elapsedMs: number;
  phaseMs: number;
  // Time spent in the universes, which makes them harder.
  deepMs: number;
  clock: MissionClock;
  ship: Entity;
  system: StarSystem;
  universe: number;
  universes: number;
  visited: number[];
  score: number;
  flown: number;
  // Stops passed, by id, and the last one passed; bodies landed on, each scored once.
  passed: Set<string>;
  landings: Set<string>;
  passing: string | null;
  // When the singularity began to grow.
  singularitySince: number | null;
  capture: Capture | null;
  waypoint: Waypoint | null;
  readings: Readings;
  storms: Storm[];
  // How bright Earth's aurora burns, 0 to 1, lit by storms and fading after, and the extra radiation a storm
  // leaves round the ship as it passes (uSv/h), fading too.
  aurora: number;
  stormDose: number;
  // The last flare: when (ms on the run's clock) and where, for the renderer; and when the next one comes.
  flare: { angle: number; strength: number; at: number } | null;
  nextFlareAt: number | null;
  nextCometAt: number | null;
  // The universe the ship is in, all of it from its seed, and the seed universes are made from on this run.
  cosmos: UniverseSpec | null;
  runSeed: number;
  // What the guns are locked on (chosen by the player), and whether they fire by themselves at what threatens.
  lockedTarget: Entity | null;
  autoFire: boolean;
  // How loud the ship has been (engines, guns), which a dark forest hears.
  signature: number;
  craters: Record<string, Crater[]>;
  phenomena: PhenomenaState;
  boss: Entity | null;
  bossFallen: boolean;
  nextImpactAt: number | null;
  nextTrafficAt: number | null;
  // Half the view in world units, for spawning just out of sight.
  view: { halfWidth: number; halfHeight: number };
}

import type { Entity } from "@/packages/games/engine";

import type { DescentState, LandingPlan, LandingWorld } from "../landing";
import { StarSystem } from "./content";
import { VoyagePhase } from "./events";
import { Fault } from "./faults";
import { UniverseNetwork, UniverseSpec } from "./universe";

export type VoyageStatus = "ready" | "flying" | "over";

// The ship being taken: it spirals into the hole at `centre` from `from` away as `progress` runs to 1.
export interface Capture {
  centre: { x: number; y: number };
  angle: number;
  from: number;
  progress: number;
  hole: Entity;
}

// A landing on its way down: the world (by id) as the landing reads it, the way down its air and gravity call for,
// the craft as it comes down, how many times faster than life the way down plays and how fast it is playing now
// (life's pace once a pilot flies it), once down, when (ms on the run's clock) and whether in one piece, and whether
// the world's people have opened fire on it.
export interface Descent {
  body: string;
  world: LandingWorld;
  plan: LandingPlan;
  craft: DescentState;
  speedUp: number;
  pace: number;
  downAt: number | null;
  isSoft: boolean;
  // Whether those who live there have opened fire yet.
  isFiredOn: boolean;
}

// A crew home: picked up where the capsule came down (by the recovery ship at sea, the recovery crews on land),
// then some days later at the pad, where a new rocket stands ready. When each began (ms on the run's clock).
export interface Homecoming {
  stage: "recovery" | "pad";
  since: number;
  days: number;
  isSea: boolean;
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

// How far a supernova's shock front spreads before it has thinned to nothing (world units).
export const SHOCK_FADES = 300;

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
  // A maze universe's network, the system the ship is in, those it has been to, and each system as it was
  // left, so going back finds it as it was.
  network: UniverseNetwork | null;
  node: number;
  explored: Set<number>;
  nodes: Map<number, UniverseSpec>;
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
  // The ship's level (its hull and mark), which the renderer draws; the faults on board, and the id the next
  // takes; the wreck being salvaged and how far; and when the next derelict drifts by.
  level: number;
  // The day of the daily voyage this run is (UTC, "2026-10-09"), or null for a free run; the giants skimmed.
  daily: string | null;
  skimmed: Set<string>;
  // The nearest the ship has come to our Sun this run, in AU.
  closestAu: number;
  faults: Fault[];
  nextFaultId: number;
  salvage: { wreck: Entity; progress: number } | null;
  nextWreckAt: number | null;
  // The landing under way, or the last one while the ship still stands where it came down; and a crew coming home.
  descent: Descent | null;
  homecoming: Homecoming | null;
  // Half the view in world units, for spawning just out of sight.
  view: { halfWidth: number; halfHeight: number };
}

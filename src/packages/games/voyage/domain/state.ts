import type { Entity } from "@/packages/games/engine";

import { Route } from "./content";
import { VoyagePhase } from "./events";

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
}

// Readings taken while flying, in world units, for the telemetry the UI turns into real ones.
export interface Readings {
  gravity: number;
  // The body pulling hardest: a route body's id, "singularity" or "hole", or null in empty space.
  dominant: string | null;
  dominantDistance: number;
  density: number;
  // The body whose air the ship is in.
  airOf: string | null;
  // Distance to the nearest black hole's centre over its horizon, for time dilation.
  holeRatio: number;
}

// Everything about a run that is not an entity.
export interface VoyageState {
  status: VoyageStatus;
  phase: VoyagePhase;
  elapsedMs: number;
  phaseMs: number;
  // Time spent in the universes, which makes them harder.
  deepMs: number;
  ship: Entity;
  route: Route;
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
  // Half the view in world units, for spawning just out of sight.
  view: { halfWidth: number; halfHeight: number };
}

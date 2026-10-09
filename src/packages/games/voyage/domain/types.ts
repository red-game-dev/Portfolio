// ready: waiting at the start. flying: under way. over: the ship is lost and the run has ended.
export type VoyageStatus = "ready" | "flying" | "over";

// solar: from Earth out past Pluto. singularity: the black hole beyond it. lost: inside it, between universes.
// universe: out the other side, in one universe after another.
export type VoyagePhase = "solar" | "singularity" | "lost" | "universe";

// How a universe looks and what drifts through it; the renderer draws each its own way.
export type VoyageStyle = "matrix" | "neural" | "blocks" | "chips" | "pixels";

export interface VoyageSize {
  width: number;
  height: number;
}

// A world point. One unit is the screen's short side, so the game feels the same on a phone and a desktop.
export interface VoyagePoint {
  x: number;
  y: number;
}

// Something passed on the way out of the solar system, by its distance from the Sun in astronomical units.
// A belt spans from `au` to `until` and fills with rocks; a body is scenery that slides past on one side.
export interface VoyageRouteStop {
  id: string;
  au: number;
  until?: number;
  // For a belt: the time between its rocks.
  every?: number;
  // For a stop too close to Earth to come round on the distance curve (the Moon): when it passes, in ms.
  atMs?: number;
  // Radius in world units, which side it passes on, and how far its centre sits in from that edge, as a share
  // of its radius (below 1 leaves part of it off screen).
  radius: number;
  side: -1 | 1;
  inset: number;
}

export interface VoyageBody {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface VoyageHazard {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  // Which of the drawn variants it is.
  shape: number;
}

export interface VoyagePickup {
  x: number;
  y: number;
  radius: number;
  kind: "score" | "shield";
}

export interface VoyageHole {
  x: number;
  y: number;
  // The event horizon: cross it and the ship is taken.
  radius: number;
  vy: number;
  // How hard it pulls; the singularity's pull grows until nothing escapes it.
  pull: number;
}

// The ship being taken: it spirals into the hole at `centre` from `from` away, closing in as `progress` runs to 1.
export interface VoyageCapture {
  centre: VoyagePoint;
  angle: number;
  from: number;
  progress: number;
}

export interface VoyageShip {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  // -1 to 1: how hard it is banking, for the renderer.
  tilt: number;
  invulnerableMs: number;
}

export interface VoyageState {
  size: VoyageSize;
  // Pixels per world unit, and the screen in world units.
  unit: number;
  width: number;
  height: number;
  status: VoyageStatus;
  phase: VoyagePhase;
  elapsedMs: number;
  phaseMs: number;
  // Distance from the Sun while in the solar system.
  au: number;
  // World units flown, all run long; the stars and backdrops scroll by it.
  flown: number;
  speed: number;
  // Time spent in the universes, which speeds them up.
  deepMs: number;
  ship: VoyageShip;
  shields: number;
  score: number;
  pickups: number;
  // Universes reached, and the one the ship is in (-1 before the first).
  universes: number;
  universe: number;
  visited: number[];
  // The last stop passed (a body or a belt), for the UI to name.
  passing: string | null;
  nextStop: number;
  // Earth, falling away below at the start.
  departureY: number;
  bodies: VoyageBody[];
  hazards: VoyageHazard[];
  items: VoyagePickup[];
  hole: VoyageHole | null;
  capture: VoyageCapture | null;
  // 0 to 1, set on a hit and fading, for the renderer's flash.
  flash: number;
  // When the next of each thing appears, in ms of phase time.
  timers: { hazard: number; pickup: number; shield: number; hole: number };
}

// What a UI shows between frames: it changes a handful of times a second at most, never once per frame.
export interface VoyageSnapshot {
  status: VoyageStatus;
  phase: VoyagePhase;
  universe: number;
  universes: number;
  shields: number;
  score: number;
  // To one decimal.
  au: number;
  passing: string | null;
}

// Where the player is steering: a direction from keys (-1 to 1 on each axis), or a point to fly to.
export interface VoyageInput {
  direction: VoyagePoint;
  target: VoyagePoint | null;
}

export interface VoyageRenderer {
  resize(size: VoyageSize, pixelRatio: number): void;
  draw(state: VoyageState, now: number): void;
}

export type BugKind = "bug" | "regression" | "flaky";

export type BugRaidStatus = "ready" | "playing" | "over";

export interface BugRaidSize {
  width: number;
  height: number;
}

export interface Bug {
  id: number;
  kind: BugKind;
  x: number;
  y: number;
  // Pixels per second at wave 1.
  speed: number;
  hitsLeft: number;
  // Offsets the leg animation so a swarm does not walk in step.
  phase: number;
  // Flaky bugs only: time until the next sideways jump.
  sidestepInMs: number;
}

// A short lived ring where a bug was squashed.
export interface Splat {
  x: number;
  y: number;
  ageMs: number;
}

export interface Cursor {
  x: number;
  y: number;
  // Shown once the keyboard is used, so mouse and touch players never see it.
  isVisible: boolean;
}

export interface BugRaidState {
  size: BugRaidSize;
  status: BugRaidStatus;
  bugs: Bug[];
  splats: Splat[];
  cursor: Cursor;
  score: number;
  lives: number;
  wave: number;
  elapsedMs: number;
}

// What a UI needs between frames. Changes a handful of times a game, never once per frame.
export interface BugRaidSnapshot {
  status: BugRaidStatus;
  score: number;
  lives: number;
  wave: number;
}

export interface BugRaidRenderer {
  resize(size: BugRaidSize, pixelRatio: number): void;
  draw(state: BugRaidState, now: number): void;
}

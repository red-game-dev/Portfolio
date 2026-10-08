// ready: on the pad. charging: the engines building up while held (or by themselves after a single press).
// launching: climbing. orbit: arrived.
export type LaunchStatus = "ready" | "charging" | "launching" | "orbit";

export interface LaunchSize {
  width: number;
  height: number;
}

// A star in a sky taller than the screen: x and y run 0 to 1, and depth sets how fast it streams past.
export interface LaunchStar {
  x: number;
  y: number;
  size: number;
  depth: number;
}

export interface LaunchState {
  size: LaunchSize;
  status: LaunchStatus;
  // 0 to 1: how far the engines have built up.
  charge: number;
  isHeld: boolean;
  // A single press launches without holding: the charge then builds by itself.
  isAutoCharging: boolean;
  // 0 to 1 through the climb, and the eased height it gives.
  ascent: number;
  altitude: number;
  // The bands passed on the way up, out of `markers`.
  markers: number;
  passed: number;
  elapsedMs: number;
  stars: LaunchStar[];
}

// What a UI needs between frames. Changes a handful of times a launch, never once per frame.
export interface LaunchSnapshot {
  status: LaunchStatus;
  passed: number;
}

export interface LaunchRenderer {
  resize(size: LaunchSize, pixelRatio: number): void;
  draw(state: LaunchState, now: number): void;
}

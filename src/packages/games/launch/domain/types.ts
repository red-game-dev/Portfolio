// ready: on the pad. charging: the engines building up while held (or by themselves after a single press).
// launching: climbing. orbit: arrived. destructing: someone pressed the button they were asked not to, and the
// countdown runs. exploding: it reached zero; a new ship is on the pad straight after.
export type LaunchStatus = "ready" | "charging" | "launching" | "orbit" | "destructing" | "exploding";

// A piece of the ship after it blows: which way it flies, how fast as a share of the board, and how big.
export interface LaunchDebris {
  angle: number;
  speed: number;
  size: number;
}

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
  // Time since the self destruct began, through the countdown and the explosion; the seconds left on the
  // countdown (0 when none runs); and 0 to 1 through the explosion.
  destructMs: number;
  countdown: number;
  explosion: number;
  debris: LaunchDebris[];
  stars: LaunchStar[];
}

// What a UI needs between frames. Changes a handful of times a launch, never once per frame.
export interface LaunchSnapshot {
  status: LaunchStatus;
  passed: number;
  // The seconds left on the self destruct, 0 when none is running.
  countdown: number;
}

export interface LaunchRenderer {
  resize(size: LaunchSize, pixelRatio: number): void;
  draw(state: LaunchState, now: number): void;
}

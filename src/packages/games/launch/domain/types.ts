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

// The kinds of rocket: a two stage booster that flies home, a heavy lifter with side boosters, and a stainless
// super heavy that stages hot.
export type LaunchVehicle = "booster" | "heavy" | "steel";

// What lies round the pad: coastal scrub, salt flats by the sea, or dry coastal hills.
export type LaunchLand = "scrub" | "flats" | "hills";

// The moments a launch is called out by, in the order they can come.
export type LaunchMilestone = "maxQ" | "boosterSeparation" | "meco" | "stageSeparation" | "hotStaging" | "boostback" | "fairing" | "seco";

// Where the rocket stands: the pad's place on Earth, what flies from it and what lies round it, and which way it
// flies (1 out to the right of the view, -1 to the left).
export interface LaunchSite {
  latitude: number;
  longitude: number;
  vehicle: LaunchVehicle;
  land: LaunchLand;
  downrange: number;
  // Whether the sea lies behind the pad, on the horizon.
  hasSea: boolean;
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
  // The flight as a launch broadcast reads it: height (km), speed (km/h) and time since lift off (s), and how far
  // the rocket has pitched over from straight up (degrees).
  altitudeKm: number;
  speedKmh: number;
  missionSeconds: number;
  pitch: number;
  site: LaunchSite;
  // The Sun over the pad at this moment of the real day: its height (degrees, negative at night) and its side of
  // the view (east to the right).
  sunElevation: number;
  sunSide: number;
  // The point on Earth under the Sun (degrees), so the Earth below is lit and turned as it really is.
  subsolarLatitude: number;
  subsolarLongitude: number;
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
  // The last moment called out on the way up, null before the first.
  milestone: LaunchMilestone | null;
  // The seconds left on the self destruct, 0 when none is running.
  countdown: number;
}

export interface LaunchRenderer {
  resize(size: LaunchSize, pixelRatio: number): void;
  draw(state: LaunchState, now: number): void;
  // A real map of the Earth below, as it arrives.
  setTexture?(id: string, image: TexImageSource): void;
  dispose?(): void;
}

// How a craft comes down on a world, as the real ones do: under parachutes to a soft landing burn or a splash
// (Soyuz, Dragon), a supersonic parachute then a powered descent (Mars), parachutes all the way (Huygens on Titan),
// a parachute high up then a drag plate through air as thick as an ocean (Venera on Venus), or a powered descent
// from orbit where there is no air to help (Apollo on the Moon).
export type LandingMethod = "parachutes" | "chuteAndBurn" | "probe" | "dragPlate" | "powered";

// The phases of a way down, in the order a method runs them: through the heat of entry, under a drogue (or a
// supersonic) parachute, under the main one, falling on a drag plate, on the engine, flown by the pilot, the last
// instant's soft landing rockets, and down.
export type LandingPhase = "entry" | "supersonic" | "drogue" | "main" | "dragPlate" | "powered" | "pilot" | "softLanding" | "down";

// A world's air near the ground in real units: density (kg/m^3), how far up it thins by e (m), and the speed of
// sound in it (m/s), which parachutes are rated by.
export interface LandingAir {
  density: number;
  scaleHeight: number;
  soundSpeed: number;
}

// A world as a landing needs it: its pull at the surface (m/s^2), its radius (m), its air, whether it is home
// (where a crew capsule comes down) and whether the spot is open water, where the capsule splashes down rather
// than firing its landing rockets. The host may learn the last only once the descent has begun.
export interface LandingWorld {
  gravity: number;
  radius: number;
  air: LandingAir | null;
  isHome: boolean;
  isWater: boolean;
}

// One step of a sequence: its phase, when it begins (once below an altitude, m, and slower than a speed, m/s;
// either left out is always met), what the craft then is to the air (its ballistic coefficient, mass over drag
// area, kg/m^2, and the lift it makes for its drag, which a capsule flown off centre has), and for a burn the
// engine's pull at full throttle as a multiple of the surface gravity.
export interface LandingStage {
  phase: LandingPhase;
  belowAltitude?: number;
  belowSpeed?: number;
  ballistic: number;
  lift?: number;
  thrust?: number;
}

// The whole way down on one world: the method, where it begins (m above the ground, degrees below level, m/s),
// the stages in order (the first is the one it begins in), the speed the guidance aims to touch down at, the
// speed above which a touchdown breaks the craft (on land, and at sea for a capsule), and where a pilot flying by
// hand takes over (the low gate of a powered descent, m), or null where there is no engine to fly.
export interface LandingPlan {
  method: LandingMethod;
  startAltitude: number;
  startAngle: number;
  startSpeed: number;
  stages: readonly LandingStage[];
  touchdownSpeed: number;
  safeSpeed: number;
  // What a capsule takes splashing down instead, where it can come down at sea.
  seaSafeSpeed: number | null;
  handover: number | null;
  // The powered descent's low gate: the guidance aims to pass this altitude (m) no faster than this speed (m/s),
  // as Apollo's approach phase ended at the low gate before the last hundred and fifty metres.
  gate: { altitude: number; speed: number } | null;
}

// The craft at one moment, changed in place as it comes down: seconds since the start, height (m), level and
// vertical speed (m/s, up positive), the stage it is in and its phase, how hard the air is heating it (against a
// capsule's peak coming home from orbit, about 1), the load the crew feels (Earth g), the throttle (0 to 1),
// whether the engine has lit, whether a pilot is flying, the seconds of burn left for them, and once down, how
// fast it met the ground.
export interface DescentState {
  time: number;
  altitude: number;
  across: number;
  up: number;
  stage: number;
  phase: LandingPhase;
  heating: number;
  load: number;
  throttle: number;
  isLit: boolean;
  isPilot: boolean;
  reserve: number;
  isDown: boolean;
  impactSpeed: number;
}

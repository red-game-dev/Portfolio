// Position, velocity and size: everything that moves and collides. `prevX` and `prevY` hold the position one
// step back, so the renderer can draw between steps.
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  radius: number;
  mass: number;
}

export interface Spin {
  angle: number;
  rate: number;
}

// The ship's own state beyond its body: where it points, what its engines are doing, its fuel and how hot its
// hull is.
export interface Ship {
  angle: number;
  prevAngle: number;
  // 0 to 1, what the engines burned last step, for the flame and the fuel.
  thrust: number;
  isBraking: boolean;
  fuel: number;
  maxFuel: number;
  // The hull's temperature in Celsius, from sunlight, air and entry, and the hottest it has been.
  temperatureC: number;
  // The body it is resting on, if landed, and where on it, from its centre.
  landedOn: string | null;
  landedOffset: { x: number; y: number } | null;
}

// The systems that keep a ship flying, each from 0 (gone) to 1 (sound). Each has a temperature it was built for
// (see `ThermalConfig`); past it, it starts to fail.
export type ModuleId = "hull" | "engines" | "shields" | "sensors" | "fuel" | "radiators";

export const MODULE_IDS: readonly ModuleId[] = ["hull", "engines", "shields", "sensors", "fuel", "radiators"];

export type Modules = Record<ModuleId, number>;

// A mark left where the hull was hit, in the ship's own frame: the angle round it (0 is the nose, clockwise),
// how bad, and what kind, which grows from a dent to a scorch to a breach as the hull fails.
export interface Decal {
  angle: number;
  severity: number;
  kind: "dent" | "scorch" | "breach";
  seed: number;
}

// Shields take hits first and come back after a pause; the hull does not come back on its own.
export interface Health {
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  // ms until the shields start to recharge.
  rechargeIn: number;
  decals: Decal[];
}

export interface Hazard {
  // Which drawn variant it is.
  shape: number;
  isIcy: boolean;
  // A comet: an icy rock whose tails grow as it nears the star.
  isComet: boolean;
}

export type PickupKind = "score" | "shield" | "fuel" | "repair";

export interface Pickup {
  kind: PickupKind;
}

// A black hole: its gravitational parameter, its horizon, and whether it is the one past Pluto.
export interface Hole {
  mu: number;
  horizon: number;
  isSingularity: boolean;
}

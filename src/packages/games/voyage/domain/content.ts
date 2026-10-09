import type { Atmosphere } from "@/packages/physics/newtonian";

// What kind of air a body has, which decides whether a ship can land on it or only skim it.
export type AtmosphereKind = "none" | "thin" | "thick" | "giant";

// A body on the way out, as the source gives it: real values, not game ones.
export interface BodyData {
  id: string;
  // Distance from the Sun (semi-major axis) in astronomical units.
  au: number;
  radiusKm: number;
  // m/s^2 at the surface, or at the one bar level of a giant.
  surfaceGravity: number;
  atmosphere: AtmosphereKind;
  surfacePressureBar: number;
  // How far to one side of the way out it sits, -1 to 1, so the route winds instead of running in a line.
  offset: number;
}

export interface BeltData {
  id: string;
  fromAu: number;
  toAu: number;
  // How crowded with rocks, against the asteroid belt at 1.
  density: number;
  isIcy: boolean;
}

export interface SolarSystemData {
  bodies: BodyData[];
  belts: BeltData[];
  // Where the black hole waits, past the last body.
  singularityAu: number;
}

// A body laid out in the game's world: position and radius in world units, gravity as a parameter that gives
// its real surface gravity at that radius, and its air as an exponential atmosphere.
export interface RouteBody {
  id: string;
  x: number;
  y: number;
  radius: number;
  mu: number;
  au: number;
  isGiant: boolean;
  isLandable: boolean;
  atmosphere: Atmosphere | null;
  surfaceGravity: number;
  surfacePressureBar: number;
  // Real kilometres per world unit near this body, for altitudes in real units.
  kmPerUnit: number;
}

// A band of rocks, as distances from the origin in world units.
export interface RouteBelt {
  id: string;
  inner: number;
  outer: number;
  density: number;
  isIcy: boolean;
}

export interface Route {
  bodies: RouteBody[];
  belts: RouteBelt[];
  // Earth's centre, where the way out starts.
  origin: { x: number; y: number };
  // World distance from the origin to the last body, and that body's distance from the Sun.
  length: number;
  lastAu: number;
  singularity: { x: number; y: number; au: number };
}

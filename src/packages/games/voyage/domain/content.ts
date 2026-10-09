import type { KeplerElements, Pole, Vec3 } from "@/packages/physics/kepler";
import type { Atmosphere } from "@/packages/physics/newtonian";

// What kind of air a body has: none, thin, thick enough to fly through, or a giant's, with no ground under it.
export type AtmosphereKind = "none" | "thin" | "thick" | "giant";

export type BodyKind = "planet" | "dwarf" | "moon";

// A body's air, as the source gives it: pressure and temperature at the ground (or a giant's one bar level) and
// at the top of the air.
export interface AirData {
  kind: Exclude<AtmosphereKind, "none">;
  pressureBar: number;
  temperatureC: number;
  topTemperatureC: number;
}

// How a body moves: round the Sun on JPL's elements, or round its planet on a circle (a negative period goes
// the other way round, as Triton does), starting from its mean longitude at J2000.
export type OrbitData =
  | { kind: "sun"; elements: KeplerElements }
  | { kind: "moon"; parent: string; distanceKm: number; periodDays: number; longitudeAtEpoch: number };

// A body, as the source gives it: real values, not game ones.
export interface BodyData {
  id: string;
  kind: BodyKind;
  orbit: OrbitData;
  radiusKm: number;
  // m/s^2 at the surface, or at the one bar level of a giant.
  surfaceGravity: number;
  air: AirData | null;
  // The ground's temperature under the Sun and on the night side, in Celsius.
  dayC: number;
  nightC: number;
  // Hours from one noon to the next (negative where it turns backwards), or null where it keeps one face to its
  // planet.
  dayHours: number | null;
  pole: Pole;
  rings: { innerKm: number; outerKm: number } | null;
}

export interface StarData {
  id: string;
  radiusKm: number;
  surfaceGravity: number;
  temperatureK: number;
  // Days for its equator to turn once.
  rotationDays: number;
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
  star: StarData;
  bodies: BodyData[];
  belts: BeltData[];
  // Past this distance from the Sun (AU) the black hole is waiting.
  edgeAu: number;
}

// A body's air in the game: an exponential atmosphere with its pressure and temperatures, so the ship can read
// how hot and how heavy the air is anywhere in it.
export interface AirModel extends Atmosphere {
  kind: Exclude<AtmosphereKind, "none">;
  pressureBar: number;
  temperatureC: number;
  topTemperatureC: number;
}

export type SystemOrbit =
  | { kind: "sun"; elements: KeplerElements }
  | { kind: "moon"; parent: string; distance: number; periodDays: number; longitudeAtEpoch: number };

// A body in the game's world. Its place, velocity, real position round the Sun and the point under the Sun on it
// change as the mission clock runs; everything else is fixed when the system is laid out.
export interface SystemBody {
  id: string;
  kind: BodyKind;
  parent: string | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Ecliptic position in AU, and distance from the Sun.
  real: Vec3;
  au: number;
  radius: number;
  mu: number;
  isGiant: boolean;
  isLandable: boolean;
  air: AirModel | null;
  surfaceGravity: number;
  dayC: number;
  nightC: number;
  // Real kilometres per world unit near this body, for altitudes in real units.
  kmPerUnit: number;
  orbit: SystemOrbit;
  dayHours: number | null;
  // The pole as an ecliptic unit vector.
  pole: Vec3;
  rings: { inner: number; outer: number } | null;
  subsolarLongitude: number;
  subsolarLatitude: number;
  // How far it has turned since the run began, in degrees, so a ship resting on it turns with it.
  spun: number;
}

export interface SystemStar {
  id: string;
  x: number;
  y: number;
  radius: number;
  mu: number;
  surfaceGravity: number;
  temperatureK: number;
  rotationDays: number;
  kmPerUnit: number;
}

// A band of rocks round the star, as distances from it in world units.
export interface SystemBelt {
  id: string;
  inner: number;
  outer: number;
  density: number;
  isIcy: boolean;
}

// How distances from the star map between AU and world units: the square root of the distance from Mercury
// out, so the planets are spread the way they are but none is an age away, and from Mercury in, a smooth curve
// down to the star's own surface.
export interface SystemScale {
  unitsPerRootAu: number;
  innerAu: number;
  starRadius: number;
  starRadiusAu: number;
}

export interface StarSystem {
  star: SystemStar;
  bodies: SystemBody[];
  belts: SystemBelt[];
  // Distance from the star past which the black hole waits.
  edge: number;
  scale: SystemScale;
}

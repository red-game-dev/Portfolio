// A point or direction in the plane.
export interface Vec2 {
  x: number;
  y: number;
}

// Something with position and velocity that forces move.
export interface Kinematic {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// A source of gravity: `mu` is its gravitational parameter (G times its mass), so the field needs no G of its
// own, and `radius` is its surface, inside which the pull stops growing. A black hole also has a `horizon`, its
// Schwarzschild radius, and pulls by the Paczynski-Wiita law instead (see `GravityField`), with `radius` then the
// least distance outside the horizon the pull is told at.
export interface GravitySource {
  x: number;
  y: number;
  mu: number;
  radius: number;
  horizon?: number;
}

// The field at a point, written into a reused object so a hot loop allocates nothing: the total acceleration,
// its size, and which source pulls hardest and how hard.
export interface FieldSample {
  ax: number;
  ay: number;
  magnitude: number;
  dominant: number;
  dominantPull: number;
  dominantDistance: number;
}

// An exponential atmosphere: density at the surface, how quickly it thins with height, and how far up it
// counts at all.
export interface Atmosphere {
  surfaceDensity: number;
  scaleHeight: number;
  top: number;
}

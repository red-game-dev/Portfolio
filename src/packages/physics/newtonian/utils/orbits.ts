// The speed of a circular orbit at distance `r` from a body of gravitational parameter `mu`.
export const circularSpeed = (mu: number, r: number): number => Math.sqrt(mu / r);

// The speed needed to leave a body for good from distance `r`.
export const escapeSpeed = (mu: number, r: number): number => Math.sqrt((2 * mu) / r);

// Surface gravity of a body, and the gravitational parameter that gives a chosen surface gravity at a radius.
export const surfaceGravity = (mu: number, radius: number): number => mu / (radius * radius);

export const muForSurfaceGravity = (gravity: number, radius: number): number => gravity * radius * radius;

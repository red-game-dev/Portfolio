// How much slower a clock runs at distance `r` from a non rotating black hole with Schwarzschild radius `rs`,
// against one far away: 1 / sqrt(1 - rs / r). Infinite at the horizon and inside it.
export const timeDilation = (r: number, rs: number): number => (r <= rs ? Infinity : 1 / Math.sqrt(1 - rs / r));

// The tidal stretch across a body of length `size` at distance `r` from a mass `mu`: the difference in pull
// between its near and far ends, which tears anything apart close enough to a black hole.
export const tidalAcceleration = (mu: number, r: number, size: number): number => (2 * mu * size) / (r * r * r);

import { wrap } from "@/packages/math/clamp";

// A whole turn in radians.
export const TAU = Math.PI * 2;

// One degree in radians: degrees times DEG are radians.
export const DEG = Math.PI / 180;

// One radian in degrees: radians times RAD are degrees.
export const RAD = 180 / Math.PI;

// An angle in degrees brought into -180 to 180.
export const wrapDegrees = (degrees: number): number => {
  const wrapped = wrap(degrees + 180, 360) - 180;

  return wrapped === -180 ? 180 : wrapped;
};

// An angle in radians brought into -pi to pi.
export const wrapRadians = (radians: number): number => wrapDegrees(radians / DEG) * DEG;

// The shortest signed turn from one angle to another, in (-PI, PI].
export const angleBetween = (from: number, to: number): number => {
  const turn = (to - from) % TAU;

  if (turn > Math.PI) {
    return turn - TAU;
  }

  return turn <= -Math.PI ? turn + TAU : turn;
};

// Part of the way from one heading to another, `t` from 0 to 1, by the shortest turn: for drawing something that
// turns between two steps without spinning the long way round.
export const lerpAngle = (from: number, to: number, t: number): number => from + angleBetween(from, to) * t;

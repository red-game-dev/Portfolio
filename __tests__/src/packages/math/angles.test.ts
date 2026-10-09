import { angleBetween, DEG, lerpAngle, RAD, TAU, wrapDegrees, wrapRadians } from "@/packages/math/angles";

describe("math/angles", () => {
  test("a turn, a degree and a radian in each other's units", () => {
    expect(TAU).toBe(Math.PI * 2);
    expect(180 * DEG).toBeCloseTo(Math.PI, 12);
    expect(Math.PI * RAD).toBeCloseTo(180, 10);
    expect(DEG * RAD).toBeCloseTo(1, 12);
  });

  test("angles wrap into -180 to 180 degrees, or -pi to pi radians, with the half turn on the positive side", () => {
    expect(wrapDegrees(190)).toBe(-170);
    expect(wrapDegrees(-190)).toBe(170);
    expect(wrapDegrees(720 + 45)).toBe(45);
    expect(wrapDegrees(-180)).toBe(180);
    expect(wrapDegrees(180)).toBe(180);
    expect(wrapRadians(TAU + 0.5)).toBeCloseTo(0.5, 12);
    expect(wrapRadians(-Math.PI)).toBeCloseTo(Math.PI, 12);
  });

  test("the shortest turn between two angles goes the short way round", () => {
    expect(angleBetween(0.1, -0.1)).toBeCloseTo(-0.2, 10);
    expect(angleBetween(3, -3)).toBeCloseTo(TAU - 6, 10);
    expect(angleBetween(0, TAU * 3 + 0.25)).toBeCloseTo(0.25, 10);
    expect(angleBetween(0, Math.PI)).toBe(Math.PI);
  });

  test("a heading part of the way to another turns by the shortest way", () => {
    expect(lerpAngle(0, 1, 0.5)).toBe(0.5);
    // From just short of a whole turn to just past it: forward across zero, not back round the circle.
    expect(lerpAngle(TAU - 0.2, 0.2, 0.5)).toBeCloseTo(TAU, 10);
    expect(lerpAngle(3, -3, 0)).toBe(3);
  });
});

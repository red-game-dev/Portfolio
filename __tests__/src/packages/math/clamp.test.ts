import { clamp, clamp01, wrap } from "@/packages/math/clamp";

describe("math/clamp", () => {
  test("a value is held within its range, at either end", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp01(1.4)).toBe(1);
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0.25)).toBe(0.25);
  });

  test("a value wraps round its range like a clock, below zero to the top", () => {
    expect(wrap(25, 24)).toBe(1);
    expect(wrap(-1, 24)).toBe(23);
    expect(wrap(24, 24)).toBe(0);
    expect(wrap(-0.25, 1)).toBe(0.75);
    expect(wrap(370, 360)).toBe(10);
  });
});

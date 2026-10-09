import { roundTo } from "@/packages/math/round";

describe("math/round", () => {
  test("rounds to the places asked, half away from zero's neighbour as Math.round does", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 0)).toBe(3);
    expect(roundTo(12.25, 1)).toBe(12.3);
    expect(roundTo(-1.26, 1)).toBe(-1.3);
    expect(roundTo(0.000123456, 6)).toBe(0.000123);
  });

  test("gives the same as rounding by hand at one and two places", () => {
    [0.15, 1.005, 47.349, 99.995, 123.456].forEach((value) => {
      expect(roundTo(value, 1)).toBe(Math.round(value * 10) / 10);
      expect(roundTo(value, 2)).toBe(Math.round(value * 100) / 100);
    });
  });
});

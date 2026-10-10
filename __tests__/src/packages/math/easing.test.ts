import { easeIn, easeInOut, lerp, pulse, smoothstep } from "@/packages/math/easing";

describe("math/easing", () => {
  test("eases in and out from 0 to 1, clamped outside", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(2)).toBe(1);
    expect(easeIn(0.5)).toBe(0.25);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  test("smoothstep fades in over a range, 0 below it and 1 above", () => {
    expect(smoothstep(-4, 12, -10)).toBe(0);
    expect(smoothstep(-4, 12, 4)).toBe(0.5);
    expect(smoothstep(-4, 12, 30)).toBe(1);
  });

  test("a pulse rises from 0 to 1 and falls back as progress runs 0 to 1, and rests at 0 outside", () => {
    expect(pulse(0)).toBe(0);
    expect(pulse(0.5)).toBe(1);
    expect(pulse(1)).toBeCloseTo(0, 12);
    expect(pulse(-1)).toBe(0);
    expect(pulse(0.25)).toBeCloseTo(pulse(0.75), 12);
  });
});

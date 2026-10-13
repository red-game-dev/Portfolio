import { ZoomInput } from "@/packages/interaction/zoom";

describe("ZoomInput", () => {
  const zoom = () => new ZoomInput({ wheel: 0.0015, pinch: 0.012, step: 1.25 });

  test("zooms out as the wheel rolls away and back in by as much as it rolls back", () => {
    const input = zoom();

    expect(input.wheel(100)).toBeCloseTo(Math.exp(-0.15));
    expect(input.wheel(100)).toBeLessThan(1);
    expect(input.wheel(-100)).toBeGreaterThan(1);
    expect(input.wheel(100) * input.wheel(-100)).toBeCloseTo(1);
    expect(input.wheel(0)).toBe(1);
  });

  test("reads a wheel in lines or pages as pixels, and a trackpad's pinch at its own stronger rate", () => {
    const input = zoom();

    expect(input.wheel(3, 1)).toBeCloseTo(input.wheel(48));
    expect(input.wheel(1, 2)).toBeCloseTo(input.wheel(800));
    expect(input.wheel(-10, 0, true)).toBeCloseTo(Math.exp(0.12));
    expect(input.wheel(-10, 0, true)).toBeGreaterThan(input.wheel(-10));
  });

  test("turns Safari's pinch, a scale since the gesture began, into a factor since the last reading", () => {
    const input = zoom();

    expect(input.gesture(1, true)).toBe(1);
    expect(input.gesture(1.2)).toBeCloseTo(1.2);
    expect(input.gesture(1.5)).toBeCloseTo(1.25);
    expect(input.gesture(1.5)).toBe(1);
    expect(input.gesture(0.9, true)).toBeCloseTo(0.9);
    expect(input.gesture(0)).toBe(1);
  });

  test("steps in and out by the same factor", () => {
    const input = zoom();

    expect(input.step(1)).toBe(1.25);
    expect(input.step(-1)).toBe(0.8);
  });

  test("zooms with two fingers by how far they spread, and not with one", () => {
    const input = zoom();

    expect(input.track(1, 0, 0)).toBeNull();
    expect(input.isPinching).toBe(false);
    expect(input.track(2, 100, 0)).toBeNull();
    expect(input.isPinching).toBe(true);
    expect(input.pointers).toBe(2);
    expect(input.track(2, 150, 0)).toBe(1.5);

    input.release(2);
    expect(input.pointers).toBe(1);
    expect(input.isPinching).toBe(false);
    expect(input.track(1, 10, 0)).toBeNull();

    input.clear();
    expect(input.pointers).toBe(0);
  });
});

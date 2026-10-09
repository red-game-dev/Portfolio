import { ZoomInput } from "@/packages/interaction/zoom";

describe("ZoomInput", () => {
  const zoom = () => new ZoomInput({ wheel: 0.0015, step: 1.25 });

  test("zooms out as the wheel rolls away and back in by as much as it rolls back", () => {
    const input = zoom();

    expect(input.wheel(100)).toBeCloseTo(Math.exp(-0.15));
    expect(input.wheel(100)).toBeLessThan(1);
    expect(input.wheel(-100)).toBeGreaterThan(1);
    expect(input.wheel(100) * input.wheel(-100)).toBeCloseTo(1);
    expect(input.wheel(0)).toBe(1);
  });

  test("steps in and out by the same factor", () => {
    const input = zoom();

    expect(input.step(1)).toBe(1.25);
    expect(input.step(-1)).toBe(0.8);
  });

  test("zooms with two fingers by how far they spread, and not with one", () => {
    const input = zoom();

    expect(input.track(1, 0, 0)).toBeNull();
    expect(input.track(2, 100, 0)).toBe(1);
    expect(input.pointers).toBe(2);
    expect(input.track(2, 150, 0)).toBe(1.5);

    input.release(2);
    expect(input.pointers).toBe(1);
    expect(input.track(1, 10, 0)).toBeNull();

    input.clear();
    expect(input.pointers).toBe(0);
  });
});

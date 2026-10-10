import { screenLean, tiltSteer } from "@/components/Finale/Voyage/tilt";

describe("steering the voyage by tilting", () => {
  test("the lean is read across and down the screen however the screen is turned", () => {
    // Tipped to the right (gamma) and the top away (beta), held upright.
    expect(screenLean(10, 20, 0)).toEqual({ x: 20, y: 10 });
    // Turned on its side either way, and upside down.
    expect(screenLean(10, 20, 90)).toEqual({ x: 10, y: -20 });
    expect(screenLean(10, 20, 270)).toEqual({ x: -10, y: 20 });
    expect(screenLean(10, 20, -90)).toEqual({ x: -10, y: 20 });
    expect(screenLean(10, 20, 180)).toEqual({ x: -20, y: -10 });
  });

  test("held as it was at the start it holds still; leaning flies that way, harder the further it leans", () => {
    const level = { x: 5, y: 40 };

    // Held level it holds still, and still steers, so a finger on the screen never takes over.
    expect(tiltSteer({ x: 6, y: 41 }, level)).toEqual({ x: 0, y: 0 });

    const right = tiltSteer({ x: 15, y: 40 }, level);
    const full = tiltSteer({ x: 5, y: 80 }, level);

    expect(right?.x).toBeGreaterThan(0);
    expect(right?.y).toBeCloseTo(0, 10);
    expect(Math.hypot(right?.x ?? 0, right?.y ?? 0)).toBeLessThan(1);
    expect(full).toEqual({ x: 0, y: 1 });
  });
});

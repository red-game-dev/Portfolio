import { PauseHolds } from "@/packages/animation/frame-loop";

describe("PauseHolds", () => {
  test("the loop pauses with the first hold and goes on only when the last lets go, in either order", () => {
    const holds = new PauseHolds();

    expect(holds.take("hangar", true)).toBe(true);
    expect(holds.take("map", false)).toBe(false);
    expect(holds.release("hangar")).toBe(false);
    expect(holds.isHeld).toBe(true);
    expect(holds.release("map")).toBe(true);
    expect(holds.isHeld).toBe(false);

    expect(holds.take("map", true)).toBe(true);
    expect(holds.take("hangar", false)).toBe(false);
    expect(holds.release("map")).toBe(false);
    expect(holds.release("hangar")).toBe(true);
  });

  test("a loop already paused by someone else stays paused when every hold lets go", () => {
    const holds = new PauseHolds();

    expect(holds.take("map", false)).toBe(false);
    expect(holds.release("map")).toBe(false);
  });

  test("letting go of a hold never taken does nothing, and clearing forgets every hold without going on", () => {
    const holds = new PauseHolds();

    expect(holds.release("map")).toBe(false);
    holds.take("map", true);
    holds.clear();
    expect(holds.isHeld).toBe(false);
    expect(holds.release("map")).toBe(false);
  });
});

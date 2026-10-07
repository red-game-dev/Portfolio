import { inViewModeOf, nextInView } from "@/hooks/useInView";

const seen = (ratio: number) => ({ isIntersecting: ratio > 0, intersectionRatio: ratio });

describe("nextInView", () => {
  it("picks the mode from the once option", () => {
    expect(inViewModeOf(undefined)).toBe("replay");
    expect(inViewModeOf(true)).toBe("once");
    expect(inViewModeOf(false)).toBe("follow");
  });

  it("replays: on past the threshold, still on while partly visible, off once gone", () => {
    expect(nextInView("replay", seen(0.1), 0.25, false)).toBe(false);
    expect(nextInView("replay", seen(0.3), 0.25, false)).toBe(true);
    expect(nextInView("replay", seen(0.1), 0.25, true)).toBe(true);
    expect(nextInView("replay", seen(0), 0.25, true)).toBe(false);
  });

  it("follows the threshold exactly", () => {
    expect(nextInView("follow", seen(0.3), 0.25, false)).toBe(true);
    expect(nextInView("follow", seen(0.1), 0.25, true)).toBe(false);
  });

  it("turns on once, past the threshold, and stays on", () => {
    expect(nextInView("once", seen(0.1), 0.5, false)).toBe(false);
    expect(nextInView("once", seen(0.6), 0.5, false)).toBe(true);
    expect(nextInView("once", seen(0), 0.5, true)).toBe(true);
  });

  it("counts an element touching the edge as in view at threshold 0", () => {
    expect(nextInView("follow", { isIntersecting: true, intersectionRatio: 0 }, 0, false)).toBe(true);
  });
});

import { LevelCurve } from "@/packages/progression/levels";

const curve = new LevelCurve({ cap: 300, base: 25, growth: 1.25 });

describe("LevelCurve", () => {
  test("starts at level 1 with nothing, each level asking a little more than the last", () => {
    expect(curve.standing(0)).toEqual({ level: 1, into: 0, toNext: 25, share: 0, isCapped: false });
    expect(curve.toNext(2)).toBeGreaterThan(curve.toNext(1));
    expect(curve.toNext(100)).toBeGreaterThan(curve.toNext(99));
  });

  test("reads any total as its level and how far into it", () => {
    const start = curve.startOf(42);

    expect(curve.levelOf(start)).toBe(42);
    expect(curve.levelOf(start - 1)).toBe(41);
    expect(curve.standing(start + curve.toNext(42) / 2)).toMatchObject({ level: 42, share: 0.5 });
  });

  test("stops at the cap, however much more there is", () => {
    expect(curve.standing(1e12)).toMatchObject({ level: 300, toNext: 0, share: 1, isCapped: true });
    expect(curve.toNext(300)).toBe(0);
  });

  test("a cap past 300 is one number", () => {
    expect(new LevelCurve({ cap: 999, base: 25, growth: 1.25 }).levelOf(1e12)).toBe(999);
    expect(() => new LevelCurve({ cap: 0, base: 25, growth: 1 })).toThrow();
  });
});

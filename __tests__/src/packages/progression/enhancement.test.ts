import { EnhanceLadder, EnhanceTier, isEnhanceTier } from "@/packages/progression/enhancement";

const TIERS: EnhanceTier[] = [
  { id: "moon", steps: 10, fall: 3, chance: [0.9, 0.55], bonus: 0.03 },
  { id: "star", steps: 10, fall: 4, chance: [0.5, 0.25], bonus: 0.06 },
  { id: "galaxy", steps: 10, fall: 6, chance: [0.22, 0.08], bonus: 0.1 },
];
const ladder = new EnhanceLadder(TIERS);
const always = () => 0;
const never = () => 0.999;

describe("EnhanceLadder", () => {
  test("reads each step as its tier and count, ten moons, then ten stars, then ten galaxies", () => {
    expect(ladder.top).toBe(30);
    expect(ladder.formOf(0)).toEqual({ step: 0, tier: null, tierIndex: -1, count: 0 });
    expect(ladder.formOf(1)).toMatchObject({ tier: "moon", count: 1 });
    expect(ladder.formOf(10)).toMatchObject({ tier: "moon", count: 10 });
    expect(ladder.formOf(11)).toMatchObject({ tier: "star", count: 1, tierIndex: 1 });
    expect(ladder.formOf(30)).toMatchObject({ tier: "galaxy", count: 10 });
    expect(ladder.formOf(99)).toMatchObject({ step: 30, tier: "galaxy" });
  });

  test("a success climbs one step, and the chance falls as the ladder climbs", () => {
    expect(ladder.attempt(0, always)).toEqual({ from: 0, to: 1, outcome: "success", chance: 0.9 });
    expect(ladder.chanceFrom(9)).toBeCloseTo(0.55);
    expect(ladder.chanceFrom(10)).toBeCloseTo(0.5);
    expect(ladder.chanceFrom(29)).toBeCloseTo(0.08);
    expect(ladder.chanceFrom(30)).toBe(0);
    expect(ladder.attempt(30, always)).toMatchObject({ outcome: "top", to: 30 });
  });

  test("a failure falls three steps among moons, four among stars, six among galaxies, back across a tier where it must", () => {
    expect(ladder.attempt(5, never)).toMatchObject({ outcome: "fell", to: 2 });
    expect(ladder.attempt(2, never)).toMatchObject({ outcome: "fell", to: 0 });
    expect(ladder.attempt(10, never).to).toBe(7);
    expect(ladder.attempt(12, never).to).toBe(8);
    expect(ladder.attempt(21, never).to).toBe(15);
    expect(ladder.attempt(25, never).to).toBe(19);
  });

  test("a protected failure keeps its step", () => {
    expect(ladder.attempt(14, never, true)).toMatchObject({ outcome: "kept", from: 14, to: 14 });
  });

  test("each step adds its own tier's bonus", () => {
    expect(ladder.bonusAt(0)).toBe(0);
    expect(ladder.bonusAt(4)).toBeCloseTo(0.12);
    expect(ladder.bonusAt(12)).toBeCloseTo(0.3 + 0.12);
    expect(ladder.bonusAt(30)).toBeCloseTo(0.3 + 0.6 + 1);
  });

  test("another tier is one more entry, and a broken ladder is refused", () => {
    const longer = new EnhanceLadder([...TIERS, { id: "universe", steps: 5, fall: 8, chance: [0.06, 0.02], bonus: 0.2 }]);

    expect(longer.top).toBe(35);
    expect(longer.formOf(33)).toMatchObject({ tier: "universe", count: 3 });
    expect(longer.attempt(33, never).to).toBe(25);
    expect(() => new EnhanceLadder([])).toThrow();
    expect(() => new EnhanceLadder([{ ...TIERS[0], steps: 0 }])).toThrow();
  });

  test("a tier read from content is checked for its shape", () => {
    expect(TIERS.every(isEnhanceTier)).toBe(true);
    expect(isEnhanceTier({ ...TIERS[0], chance: [1.2, 0.5] })).toBe(false);
    expect(isEnhanceTier({ ...TIERS[0], steps: 2.5 })).toBe(false);
    expect(isEnhanceTier(null)).toBe(false);
  });
});

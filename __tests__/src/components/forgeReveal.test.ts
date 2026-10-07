import { revealedCharacters } from "@/components/SkillForge/utils/reveal";

describe("skill forge reveal", () => {
  test("every card of a long station is fully revealed when the clock ends", () => {
    const count = 70;

    for (let index = 0; index < count; index += 1) {
      expect(revealedCharacters(1, index, count, 12)).toBe(12);
    }
  });

  test("nothing is revealed before the clock starts, and later cards start later", () => {
    expect(revealedCharacters(0, 0, 10, 8)).toBe(0);
    expect(revealedCharacters(0.3, 0, 10, 8)).toBeGreaterThan(revealedCharacters(0.3, 9, 10, 8));
  });
});

import { createSeededRandom, randomBetween } from "@/packages/math/random";

describe("math/random", () => {
  test("the same seed replays the same sequence", () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  test("different seeds diverge", () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  test("values stay in [0, 1), including for a zero or negative seed", () => {
    [0, -7, 123456].forEach((seed) => {
      const random = createSeededRandom(seed);
      const values = Array.from({ length: 500 }, () => random());

      expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    });
  });

  test("randomBetween scales into the range", () => {
    const random = createSeededRandom(9);
    const values = Array.from({ length: 200 }, () => randomBetween(random, 5, 10));

    expect(values.every((value) => value >= 5 && value < 10)).toBe(true);
  });
});

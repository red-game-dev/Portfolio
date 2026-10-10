import { createSeededRandom, createWarmedRandom, pick, pickWeighted, randomBetween, randomInt } from "@/packages/math/random";

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

  test("a warmed generator is the seeded one with its first draws thrown away, three unless told otherwise", () => {
    const seeded = createSeededRandom(77);
    const thrown = [seeded(), seeded(), seeded()];
    const warmed = createWarmedRandom(77);

    expect([warmed(), warmed()]).toEqual([seeded(), seeded()]);
    expect(createWarmedRandom(77, 1)()).toBe(thrown[1]);
  });

  test("randomBetween scales into the range", () => {
    const random = createSeededRandom(9);
    const values = Array.from({ length: 200 }, () => randomBetween(random, 5, 10));

    expect(values.every((value) => value >= 5 && value < 10)).toBe(true);
  });

  test("pick takes one item for one draw, the whole range reachable, and nothing from an empty list", () => {
    const items = ["a", "b", "c", "d"];

    expect(pick(() => 0, items)).toBe("a");
    expect(pick(() => 0.5, items)).toBe("c");
    expect(pick(() => 0.999, items)).toBe("d");
    // A source that returned 1 still lands on the last item.
    expect(pick(() => 1, items)).toBe("d");
    expect(pick(() => 0.3, [])).toBeUndefined();

    let draws = 0;

    pick(() => {
      draws += 1;

      return 0.2;
    }, items);
    expect(draws).toBe(1);
  });

  test("randomInt covers both ends of its range", () => {
    expect(randomInt(() => 0, 2, 5)).toBe(2);
    expect(randomInt(() => 0.999, 2, 5)).toBe(5);
  });

  test("pickWeighted lands in proportion to weight, skips the weightless, and gives null when nothing weighs", () => {
    const options: Array<[string, number]> = [["rare", 1], ["never", 0], ["common", 3]];
    const weightOf = ([, weight]: [string, number]) => weight;

    expect(pickWeighted(() => 0, options, weightOf)?.[0]).toBe("rare");
    expect(pickWeighted(() => 0.24, options, weightOf)?.[0]).toBe("rare");
    expect(pickWeighted(() => 0.25, options, weightOf)?.[0]).toBe("common");
    expect(pickWeighted(() => 0.999, options, weightOf)?.[0]).toBe("common");
    expect(pickWeighted(() => 0.5, [["a", -2], ["b", 0]], weightOf)).toBeNull();
  });
});

import { median, sum, sumBy } from "@/packages/math/stats";

describe("math/stats", () => {
  test("sums numbers, or what is read off each item, with nothing summing to 0", () => {
    expect(sum([1, 2, 3.5])).toBe(6.5);
    expect(sum([])).toBe(0);
    expect(sumBy([{ share: 40 }, { share: 60 }], (tier) => tier.share)).toBe(100);
    expect(sumBy(["ab", "cde"], (text) => text.length)).toBe(5);
  });

  test("the median is the middle once sorted, the upper middle for an even count, and leaves its input alone", () => {
    const intervals = [16, 90, 17, 15, 16.5];

    expect(median(intervals)).toBe(16.5);
    expect(intervals).toEqual([16, 90, 17, 15, 16.5]);
    expect(median([4, 1, 3, 2])).toBe(3);
    expect(median([7])).toBe(7);
    expect(median([])).toBeNaN();
  });
});

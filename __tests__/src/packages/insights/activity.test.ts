import { activityStats } from "@/packages/insights/activity";

const quiet = (length: number) => "0".repeat(length);

describe("insights/activity", () => {
  test("counts active days and the longest run of them", () => {
    const stats = activityStats([{ year: 2025, levels: `0110111100${quiet(355)}` }]);

    expect(stats.activeDays).toBe(6);
    expect(stats.totalDays).toBe(365);
    expect(stats.longestDayStreak).toBe(4);
    expect(stats.yearStreaks[2025]).toEqual({ start: 4, end: 7 });
  });

  test("a streak carries across the new year, while each row keeps its own", () => {
    const stats = activityStats([
      { year: 2024, levels: `${quiet(363)}111` },
      { year: 2025, levels: `111${quiet(362)}` },
    ]);

    expect(stats.longestDayStreak).toBe(6);
    expect(stats.yearStreaks[2025]).toEqual({ start: 0, end: 2 });
  });

  test("weeks run Sunday to Saturday: runs of active weeks and perfect weeks", () => {
    // 2023 began on a Sunday, so days 0 to 6 are one week and 7 to 13 the next.
    const stats = activityStats([{ year: 2023, levels: `1111111${"0000001"}${"0000000"}1${quiet(343)}` }]);

    expect(stats.perfectWeeks).toBe(1);
    expect(stats.longestWeekStreak).toBe(2);
  });

  test("the busiest month has the most active days, the busier one winning a tie", () => {
    const january = `${"1".repeat(3)}${quiet(28)}`;
    const february = `${"4".repeat(3)}${quiet(25)}`;
    const stats = activityStats([{ year: 2025, levels: `${january}${february}${quiet(365 - 59)}` }]);

    expect(stats.busiestMonth).toEqual({ year: 2025, month: 1, activeDays: 3 });
  });

  test("an empty calendar has no streaks and no busiest month", () => {
    const stats = activityStats([{ year: 2025, levels: quiet(365) }]);

    expect(stats.longestDayStreak).toBe(0);
    expect(stats.busiestMonth).toBeNull();
    expect(stats.yearStreaks[2025]).toBeNull();
  });
});

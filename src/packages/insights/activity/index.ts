// Streaks and highlights from a contribution calendar: one digit per day from 1 January, 0 for a quiet
// day up to 4 for the busiest, as GitHub buckets them. Pure and deterministic, so the build, the browser
// and the tests always agree.

export interface ActivityYear {
  year: number;
  levels: string;
}

// A run of days inside one year, by day of the year from 0.
export interface DayRange {
  start: number;
  end: number;
}

export interface ActivityStats {
  activeDays: number;
  totalDays: number;
  // The longest run of active days, which may cross a new year.
  longestDayStreak: number;
  // The longest run of weeks, Sunday to Saturday, with at least one active day.
  longestWeekStreak: number;
  // Weeks with all seven days active.
  perfectWeeks: number;
  // The month with the most active days, the busier one on a tie.
  busiestMonth: { year: number; month: number; activeDays: number } | null;
  // The longest run inside each year, for drawing it on that year's row.
  yearStreaks: Record<number, DayRange | null>;
}

const DAY_MS = 86_400_000;

interface Day {
  year: number;
  index: number;
  // Days since 1 January 1970, so runs can cross years.
  epoch: number;
  level: number;
}

const daysOf = (years: ActivityYear[]): Day[] => years
  .slice()
  .sort((first, second) => first.year - second.year)
  .flatMap(({ year, levels }) => {
    const first = Date.UTC(year, 0, 1) / DAY_MS;

    return Array.from(levels, (level, index) => ({ year, index, epoch: first + index, level: Number(level) || 0 }));
  });

// 1 January 1970 was a Thursday, so the first Sunday is day 3.
const weekOf = (epoch: number) => Math.floor((epoch - 3) / 7);

const longestRun = (values: number[]) => {
  let best = 0;
  let current = 0;
  let previous: number | null = null;

  values.forEach((value) => {
    current = previous !== null && value === previous + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = value;
  });

  return best;
};

const longestRange = (days: Day[]): DayRange | null => {
  let best: DayRange | null = null;
  let start: number | null = null;

  days.forEach((day, position) => {
    if (day.level > 0) {
      start = start ?? day.index;

      const next = days[position + 1];
      const endsHere = !next || next.level === 0;

      if (endsHere && (best === null || day.index - start > best.end - best.start)) {
        best = { start, end: day.index };
      }
    } else {
      start = null;
    }
  });

  return best;
};

export const activityStats = (years: ActivityYear[]): ActivityStats => {
  const days = daysOf(years);
  const active = days.filter((day) => day.level > 0);
  const weeks = new Map<number, number>();
  const months = new Map<string, { year: number; month: number; activeDays: number; total: number }>();

  active.forEach((day) => {
    const week = weekOf(day.epoch);
    const date = new Date(day.epoch * DAY_MS);
    const key = `${day.year}-${date.getUTCMonth()}`;
    const month = months.get(key) ?? { year: day.year, month: date.getUTCMonth(), activeDays: 0, total: 0 };

    weeks.set(week, (weeks.get(week) ?? 0) + 1);
    months.set(key, { ...month, activeDays: month.activeDays + 1, total: month.total + day.level });
  });

  const busiest = [...months.values()].sort((first, second) => second.activeDays - first.activeDays || second.total - first.total)[0];

  return {
    activeDays: active.length,
    totalDays: days.length,
    longestDayStreak: longestRun(active.map((day) => day.epoch)),
    longestWeekStreak: longestRun([...weeks.keys()].sort((first, second) => first - second)),
    perfectWeeks: [...weeks.values()].filter((count) => count === 7).length,
    busiestMonth: busiest ? { year: busiest.year, month: busiest.month, activeDays: busiest.activeDays } : null,
    yearStreaks: Object.fromEntries(years.map(({ year }) => [year, longestRange(days.filter((day) => day.year === year))])),
  };
};

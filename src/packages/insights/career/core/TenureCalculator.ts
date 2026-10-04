import { MonthRange, Tenure } from "../domain/types";
import { toMonthIndex } from "../utils/months";

// Years spent in a role across several jobs, with overlapping jobs counted once. Measured against a fixed
// "as of" date rather than today, so the server and the browser always agree on the result.
export class TenureCalculator {
  private readonly asOf: number;

  constructor(asOf: string) {
    this.asOf = toMonthIndex(asOf);
  }

  public months(tenures: Tenure[]): number {
    return this.merge(tenures.map((tenure) => this.toRange(tenure)))
      .reduce((total, range) => total + (range.end - range.start), 0);
  }

  public years(tenures: Tenure[]): number {
    return Math.floor(this.months(tenures) / 12);
  }

  // The first month any of the tenures began, for "since 2015" style labels.
  public since(tenures: Tenure[]): number {
    return Math.floor(Math.min(...tenures.map((tenure) => toMonthIndex(tenure.from))) / 12);
  }

  private toRange(tenure: Tenure): MonthRange {
    const start = toMonthIndex(tenure.from);
    const end = Math.min(this.asOf, tenure.to ? toMonthIndex(tenure.to) : this.asOf);

    return { start, end: Math.max(start, end) };
  }

  private merge(ranges: MonthRange[]): MonthRange[] {
    return [...ranges]
      .sort((first, second) => first.start - second.start)
      .reduce<MonthRange[]>((merged, range) => {
        const last = merged[merged.length - 1];

        if (last && range.start <= last.end) {
          last.end = Math.max(last.end, range.end);

          return merged;
        }

        return [...merged, { ...range }];
      }, []);
  }
}

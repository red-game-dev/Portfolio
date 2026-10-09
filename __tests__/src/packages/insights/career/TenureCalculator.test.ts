import { TenureCalculator, toIsoMonth, toMonthIndex } from "@/packages/insights/career";

describe("insights/career TenureCalculator", () => {
  const calculator = new TenureCalculator("Oct 2026");

  test("reads month and year, or a year alone as January", () => {
    expect(toMonthIndex("Nov 2019") - toMonthIndex("Feb 2019")).toBe(9);
    expect(toMonthIndex("2025")).toBe(toMonthIndex("Jan 2025"));
    expect(() => toMonthIndex("someday")).toThrow("Cannot read the date");
  });

  test("writes a date as an ISO 8601 month, or a year alone, for structured data", () => {
    expect(toIsoMonth("Nov 2019")).toBe("2019-11");
    expect(toIsoMonth("Apr 2015")).toBe("2015-04");
    expect(toIsoMonth("2025")).toBe("2025");
  });

  test("an open tenure runs to the as of date", () => {
    expect(calculator.years([{ from: "Apr 2015" }])).toBe(11);
  });

  test("overlapping jobs are counted once", () => {
    expect(calculator.months([
      { from: "Jan 2020", to: "Jan 2022" },
      { from: "Jan 2021", to: "Jan 2023" },
    ])).toBe(36);
  });

  test("gaps between jobs are not counted", () => {
    expect(calculator.months([
      { from: "Feb 2019", to: "Nov 2022" },
      { from: "Oct 2023" },
    ])).toBe(45 + 36);
  });

  test("since gives the first year of any tenure", () => {
    expect(calculator.since([{ from: "Jul 2017", to: "Jan 2019" }, { from: "Apr 2015" }])).toBe(2015);
  });
});

import { InMemoryContentSource } from "@/packages/core/content";
import { frameIndexAt, heightBetween, isRepoGrowth, RepoGrowth, RepoGrowthService, RepoGrowthValidator } from "@/packages/insights/repo-growth";

const growth: RepoGrowth = {
  districts: ["code", "tests"],
  frames: [
    { date: "2022-11-01", lines: [0, 0] },
    { date: "2022-11-02", lines: [100, 20] },
    { date: "2026-10-08", lines: [400, 200] },
  ],
};

describe("repo growth", () => {
  test("the guard checks the shape a generated history must have", () => {
    expect(isRepoGrowth(growth)).toBe(true);
    expect(isRepoGrowth({ districts: ["a"], frames: [{ date: "x", lines: ["1"] }] })).toBe(false);
    expect(isRepoGrowth(null)).toBe(false);
  });

  test("the validator collects every rule a history breaks", () => {
    const broken: RepoGrowth = {
      districts: ["a", "a"],
      frames: [{ date: "2026-10-08", lines: [1, 2] }, { date: "nope", lines: [1] }, { date: "2022-01-01", lines: [-1, 1.5] }],
    };

    expect(new RepoGrowthValidator().validate(broken).errors).toEqual([
      "a district is listed twice",
      "frame 2 has no YYYY-MM-DD date",
      "frame 2 has 1 counts for 2 districts",
      "frame 3 comes before the frame it follows",
      "frame 3 has a count that is not a whole number of lines",
    ]);
  });

  test("the service maps lines to heights against the tallest district ever, with each commit's total", () => {
    const view = new RepoGrowthService(new InMemoryContentSource(growth)).getView();

    expect(view.peak).toBe(400);
    expect(view.frames[1]).toEqual({ date: "2022-11-02", heights: [0.25, 0.05], total: 120 });
    expect(view.frames[2].heights).toEqual([1, 0.5]);
  });

  test("a bad history fails loudly instead of half rendering", () => {
    expect(() => new RepoGrowthService(new InMemoryContentSource({ districts: [] })).getView()).toThrow();
  });

  test("a milestone lands on the first commit on or after its date, and playback glides between commits", () => {
    const view = new RepoGrowthService(new InMemoryContentSource(growth)).getView();

    expect(frameIndexAt(view, "2022-11-02")).toBe(1);
    expect(frameIndexAt(view, "2023-01-01")).toBe(2);
    expect(frameIndexAt(view, "2030-01-01")).toBe(2);
    expect(heightBetween(view, 1.5, 0)).toBeCloseTo(0.625);
    expect(heightBetween(view, 9, 0)).toBe(1);
  });
});

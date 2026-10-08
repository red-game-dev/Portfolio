import { milestoneAt, playbackPosition, TIMELAPSE_MS } from "@/components/AiUsage/timelapse";
import { portfolioData } from "@/data/resume";
import { repoGrowthView } from "@/services/repo-growth";

const { timelapse } = portfolioData;

describe("the repo time-lapse", () => {
  test("plays from the first commit to the last over its length, and stays on the ends", () => {
    expect(playbackPosition(0, 101)).toBe(0);
    expect(playbackPosition(TIMELAPSE_MS / 2, 101)).toBe(50);
    expect(playbackPosition(TIMELAPSE_MS * 2, 101)).toBe(100);
    expect(playbackPosition(-5, 101)).toBe(0);
  });

  test("shows the latest milestone the frame has reached, and none before the first", () => {
    const view = { ...repoGrowthView, frames: [{ date: "2022-10-01", heights: [], total: 0 }, ...repoGrowthView.frames] };

    expect(milestoneAt(timelapse.milestones, view, 0)).toBeNull();
    expect(milestoneAt(timelapse.milestones, view, view.frames.length - 1)).toEqual(timelapse.milestones[timelapse.milestones.length - 1]);
  });

  test("the committed history passes its own rules, and every district in it has a label", () => {
    expect(repoGrowthView.frames.length).toBeGreaterThan(100);
    expect(repoGrowthView.districts.filter((district) => !timelapse.districts[district])).toEqual([]);
  });

  test("milestones are in order and inside the history, so each one lands on a real commit", () => {
    const dates = timelapse.milestones.map((milestone) => milestone.date);
    const first = repoGrowthView.frames[0].date;
    const last = repoGrowthView.frames[repoGrowthView.frames.length - 1].date;

    expect(dates).toEqual([...dates].sort());
    expect(dates.filter((date) => date < first || date > last)).toEqual([]);
  });
});

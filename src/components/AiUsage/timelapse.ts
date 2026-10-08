import type { RepoGrowthView } from "@/packages/insights/repo-growth";
import { TimelapseMilestone } from "@/types/timelapse";

// How long a full replay takes, whatever the number of commits.
export const TIMELAPSE_MS = 12000;

// Where playback is, as a fractional frame, `elapsedMs` into a replay of `frameCount` frames.
export const playbackPosition = (elapsedMs: number, frameCount: number, durationMs = TIMELAPSE_MS): number => Math.min(
  frameCount - 1,
  Math.max(0, (elapsedMs / durationMs) * (frameCount - 1)),
);

// The latest milestone reached by the frame shown, if any.
export const milestoneAt = (milestones: TimelapseMilestone[], view: RepoGrowthView, frame: number): TimelapseMilestone | null => {
  const date = view.frames[Math.min(view.frames.length - 1, Math.max(0, frame))]?.date ?? "";

  return [...milestones].reverse().find((milestone) => milestone.date <= date) ?? null;
};

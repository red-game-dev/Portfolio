import { clamp } from "@/packages/math/clamp";

import { RepoGrowthView } from "../domain/types";

// The first frame on or after `date`, so a milestone lands on the commit that made it; the last frame if the
// date is later than the history.
export const frameIndexAt = ({ frames }: RepoGrowthView, date: string): number => {
  const index = frames.findIndex((frame) => frame.date >= date);

  return index < 0 ? frames.length - 1 : index;
};

// A district's height part of the way between two frames, so playback can glide rather than step.
export const heightBetween = ({ frames }: RepoGrowthView, position: number, district: number): number => {
  const from = clamp(Math.floor(position), 0, frames.length - 1);
  const to = Math.min(frames.length - 1, from + 1);
  const t = position - from;

  return frames[from].heights[district] * (1 - t) + frames[to].heights[district] * t;
};

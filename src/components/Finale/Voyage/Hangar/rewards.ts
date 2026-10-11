import type { ProgressView } from "@/packages/games/voyage";

// Which achievement wins each cosmetic, read from the achievements themselves.
export const ACHIEVEMENTS_BY_REWARD = (progress: ProgressView): Record<string, string> => Object.fromEntries(progress.achievements
  .filter(({ spec }) => spec.reward !== null)
  .map(({ spec }) => [spec.reward ?? "", spec.id]));

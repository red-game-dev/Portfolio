import { FrameScheduler } from "../domain/types";

export interface FrameBudgetOptions {
  // How many display frames to sample.
  frames?: number;
  // A typical frame slower than this means the device is struggling.
  budgetMs?: number;
  onSlow: () => void;
}

// Watches the display's frame rate for a moment and says once whether a typical frame ran over budget, so
// heavy effects can start at full quality and step down only on devices that cannot keep up. The median
// interval, not the mean, so one slow frame while something loads does not count. Returns a cancel.
export const watchFrameBudget = (scheduler: FrameScheduler, { frames = 90, budgetMs = 22, onSlow }: FrameBudgetOptions) => {
  const intervals: number[] = [];
  let last: number | null = null;
  let handle = 0;

  const step = (time: number) => {
    if (last !== null) {
      intervals.push(time - last);
    }

    last = time;

    if (intervals.length < frames) {
      handle = scheduler.request(step);

      return;
    }

    const sorted = [...intervals].sort((first, second) => first - second);

    if (sorted[Math.floor(sorted.length / 2)] > budgetMs) {
      onSlow();
    }
  };

  handle = scheduler.request(step);

  return () => scheduler.cancel(handle);
};

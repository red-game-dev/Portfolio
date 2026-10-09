import { clamp } from "@/packages/math/clamp";
import { median } from "@/packages/math/stats";

export interface QualityGovernorOptions {
  // How many quality levels there are, 0 the finest.
  levels: number;
  // The level to start at: finest, unless a host knows the device is modest.
  start?: number;
  // How long each judgement samples (ms of real time).
  windowMs?: number;
  // A typical frame slower than this steps quality down; faster than this, for long enough, steps it back up.
  slowMs?: number;
  fastMs?: number;
  recoverAfterMs?: number;
  // How many times quality may step back up, so a device on the edge does not flicker between levels.
  maxRecoveries?: number;
}

// Frames longer than this are a pause (a hidden tab, a dialog), not a slow device.
const PAUSE_MS = 250;

// Keeps a renderer as fine as the device can draw smoothly. It reads the time between frames, judges a window at
// a time by its median (one slow frame while something loads does not count), steps down a level when frames
// run slow, and steps back up, a limited number of times, only after frames have stayed fast for a while. It
// draws nothing itself: `sample` returns the new level when it changes.
export class QualityGovernor {
  private current: number;
  private readonly samples: number[] = [];
  private windowStart: number | null = null;
  private fastSince: number | null = null;
  private recoveries = 0;
  private readonly options: Required<QualityGovernorOptions>;

  constructor(options: QualityGovernorOptions) {
    this.options = { start: 0, windowMs: 1500, slowMs: 22, fastMs: 14, recoverAfterMs: 8000, maxRecoveries: 1, ...options };
    this.current = clamp(this.options.start, 0, this.options.levels - 1);
  }

  public get level(): number {
    return this.current;
  }

  // One frame's interval at a moment (both ms); the new level when this changes it, else null.
  public sample(intervalMs: number, now: number): number | null {
    if (intervalMs <= 0 || intervalMs > PAUSE_MS) {
      return null;
    }

    this.windowStart = this.windowStart ?? now;
    this.samples.push(intervalMs);

    if (now - this.windowStart < this.options.windowMs) {
      return null;
    }

    const typical = median(this.samples);
    const { levels, slowMs, fastMs, recoverAfterMs, maxRecoveries } = this.options;

    this.samples.length = 0;
    this.windowStart = now;

    if (typical > slowMs && this.current < levels - 1) {
      this.fastSince = null;

      return this.set(this.current + 1);
    }

    if (typical < fastMs && this.current > 0 && this.recoveries < maxRecoveries) {
      this.fastSince = this.fastSince ?? now;

      if (now - this.fastSince >= recoverAfterMs) {
        this.recoveries += 1;
        this.fastSince = null;

        return this.set(this.current - 1);
      }
    } else {
      this.fastSince = null;
    }

    return null;
  }

  private set(level: number): number {
    this.current = level;

    return level;
  }
}

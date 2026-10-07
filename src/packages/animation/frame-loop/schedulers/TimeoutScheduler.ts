import { FrameScheduler } from "../domain/types";

const DEFAULT_INTERVAL_MS = 1000 / 60;

// For places without animation frames: web workers, Node, or a loop that must keep ticking while
// its tab is hidden.
export class TimeoutScheduler implements FrameScheduler {
  private readonly intervalMs: number;

  constructor(intervalMs = DEFAULT_INTERVAL_MS) {
    this.intervalMs = intervalMs;
  }

  public request(callback: (time: number) => void): number {
    return Number(setTimeout(() => callback(performance.now()), this.intervalMs));
  }

  public cancel(handle: number): void {
    clearTimeout(handle);
  }
}

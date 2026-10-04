// The clock a loop runs on. Browsers use animation frames; workers, servers and tests can use a
// timer or a manual stepper instead, without the loop knowing the difference.
export interface FrameScheduler {
  request(callback: (time: number) => void): number;
  cancel(handle: number): void;
}

export interface FrameLoopOptions {
  // Updates per second. The loop skips display frames to hold this rate.
  framesPerSecond?: number;
  // Upper bound for one update, so a tab coming back from the background takes one normal step
  // instead of one enormous one.
  maxStepMs?: number;
  scheduler?: FrameScheduler;
}

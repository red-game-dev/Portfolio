import { FrameLoopOptions, FrameScheduler } from "../domain/types";
import { AnimationFrameScheduler } from "../schedulers/AnimationFrameScheduler";

const DEFAULT_FRAMES_PER_SECOND = 60;
const DEFAULT_MAX_STEP_MS = 100;
// Display frames arrive a fraction early or late. Without slack a 60 fps target on a 60 Hz screen
// would drop every other frame.
const FRAME_SLACK_MS = 1;

// The loop every animated thing shares: effects, games, simulations. It owns scheduling, rate
// limiting, step clamping and start and stop; subclasses only say how to update and how to render.
export abstract class FrameLoop {
  protected readonly scheduler: FrameScheduler;
  private readonly frameMs: number;
  private readonly maxStepMs: number;
  private handle: number | null = null;
  private lastStepAt: number | null = null;

  constructor({
    framesPerSecond = DEFAULT_FRAMES_PER_SECOND,
    maxStepMs = DEFAULT_MAX_STEP_MS,
    scheduler = new AnimationFrameScheduler(),
  }: FrameLoopOptions = {}) {
    this.frameMs = 1000 / framesPerSecond;
    this.maxStepMs = maxStepMs;
    this.scheduler = scheduler;
  }

  public get isRunning(): boolean {
    return this.handle !== null;
  }

  public start(): void {
    if (this.handle !== null || !this.canStart()) {
      return;
    }

    this.lastStepAt = null;
    this.handle = this.scheduler.request(this.onFrame);
  }

  public stop(): void {
    if (this.handle === null) {
      return;
    }

    this.scheduler.cancel(this.handle);
    this.handle = null;
  }

  // Lets a subclass refuse to run, for example when it is showing a still frame for reduced motion.
  protected canStart(): boolean {
    return true;
  }

  // An arrow property, so it can be handed to the scheduler without losing `this`.
  private readonly onFrame = (time: number) => {
    this.handle = this.scheduler.request(this.onFrame);

    const elapsed = this.lastStepAt === null ? this.frameMs : time - this.lastStepAt;

    if (elapsed < this.frameMs - FRAME_SLACK_MS) {
      return;
    }

    this.lastStepAt = time;
    this.update(Math.min(elapsed, this.maxStepMs), time);
    this.render(time);
  };

  protected abstract update(deltaMs: number, now: number): void;

  protected abstract render(now: number): void;
}

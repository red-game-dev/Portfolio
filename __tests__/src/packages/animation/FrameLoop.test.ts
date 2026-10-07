import { FrameLoop, ManualScheduler, watchFrameBudget } from "@/packages/animation/frame-loop";

class RecordingLoop extends FrameLoop {
  public readonly updates: number[] = [];
  public renders = 0;
  public isAllowedToStart = true;

  protected canStart(): boolean {
    return this.isAllowedToStart;
  }

  protected update(deltaMs: number): void {
    this.updates.push(deltaMs);
  }

  protected render(): void {
    this.renders += 1;
  }
}

describe("animation/frame-loop", () => {
  test("steps once per frame interval and skips frames that arrive early", () => {
    const scheduler = new ManualScheduler();
    const loop = new RecordingLoop({ framesPerSecond: 30, scheduler });

    loop.start();
    [0, 16, 33, 50, 67].forEach((time) => scheduler.tick(time));

    expect(loop.updates).toHaveLength(3);
    expect(loop.renders).toBe(3);
  });

  test("tolerates display frames that land a fraction early", () => {
    const scheduler = new ManualScheduler();
    const loop = new RecordingLoop({ framesPerSecond: 60, scheduler });

    loop.start();
    [0, 16.6, 33.2, 49.8].forEach((time) => scheduler.tick(time));

    expect(loop.updates).toHaveLength(4);
  });

  test("clamps a long gap to one bounded step", () => {
    const scheduler = new ManualScheduler();
    const loop = new RecordingLoop({ framesPerSecond: 30, maxStepMs: 100, scheduler });

    loop.start();
    scheduler.tick(0);
    scheduler.tick(5000);

    expect(loop.updates[1]).toBe(100);
  });

  test("stop cancels the pending frame and start is idempotent", () => {
    const scheduler = new ManualScheduler();
    const loop = new RecordingLoop({ scheduler });

    loop.start();
    loop.start();
    expect(scheduler.pendingCount).toBe(1);
    expect(loop.isRunning).toBe(true);

    loop.stop();
    expect(scheduler.pendingCount).toBe(0);
    expect(loop.isRunning).toBe(false);
  });

  test("a subclass can refuse to start", () => {
    const scheduler = new ManualScheduler();
    const loop = new RecordingLoop({ scheduler });

    loop.isAllowedToStart = false;
    loop.start();

    expect(scheduler.pendingCount).toBe(0);
  });
});

describe("watchFrameBudget", () => {
  const run = (interval: number, frames = 10) => {
    const scheduler = new ManualScheduler();
    const onSlow = jest.fn();

    watchFrameBudget(scheduler, { frames, budgetMs: 22, onSlow });

    for (let frame = 0; frame <= frames; frame += 1) {
      scheduler.tick(frame * interval);
    }

    return { onSlow, scheduler };
  };

  it("says nothing on a device that keeps up, and stops watching", () => {
    const { onSlow, scheduler } = run(16.7);

    expect(onSlow).not.toHaveBeenCalled();
    expect(scheduler.pendingCount).toBe(0);
  });

  it("says once when a typical frame runs over budget", () => {
    expect(run(33).onSlow).toHaveBeenCalledTimes(1);
  });

  it("ignores a single slow frame", () => {
    const scheduler = new ManualScheduler();
    const onSlow = jest.fn();
    const times = [0, 16, 32, 48, 200, 216, 232, 248, 264, 280, 296];

    watchFrameBudget(scheduler, { frames: 10, budgetMs: 22, onSlow });
    times.forEach((time) => scheduler.tick(time));

    expect(onSlow).not.toHaveBeenCalled();
  });

  it("can be cancelled", () => {
    const scheduler = new ManualScheduler();
    const cancel = watchFrameBudget(scheduler, { onSlow: jest.fn() });

    cancel();
    expect(scheduler.pendingCount).toBe(0);
  });
});

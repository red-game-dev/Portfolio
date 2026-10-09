import { System } from "../domain/types";

export interface SystemPipelineOptions {
  // The fixed step, in ms. Physics stays stable and repeatable whatever the display's rate.
  stepMs?: number;
  // The most steps one frame may run, so a long stall does not freeze the page catching up.
  maxSteps?: number;
}

// Runs systems in order at a fixed step, however often frames arrive: time accumulates and is spent in whole
// steps, and what is left over is the `alpha` a renderer uses to draw between the last two steps.
export class SystemPipeline<TContext> {
  private readonly systems: ReadonlyArray<System<TContext>>;
  private readonly stepMs: number;
  private readonly maxSteps: number;
  private accumulated = 0;

  constructor(systems: ReadonlyArray<System<TContext>>, { stepMs = 1000 / 120, maxSteps = 8 }: SystemPipelineOptions = {}) {
    this.systems = systems;
    this.stepMs = stepMs;
    this.maxSteps = maxSteps;
  }

  public get alpha(): number {
    return this.accumulated / this.stepMs;
  }

  public get step(): number {
    return this.stepMs;
  }

  // Spends `frameMs` in fixed steps and returns how many ran.
  public advance(context: TContext, frameMs: number, afterStep?: () => void): number {
    this.accumulated += frameMs;

    let steps = 0;

    while (this.accumulated >= this.stepMs && steps < this.maxSteps) {
      this.runOnce(context);
      afterStep?.();
      this.accumulated -= this.stepMs;
      steps += 1;
    }

    // Too far behind: drop the backlog rather than spiral.
    if (steps === this.maxSteps) {
      this.accumulated = Math.min(this.accumulated, this.stepMs);
    }

    return steps;
  }

  public runOnce(context: TContext): void {
    const dt = this.stepMs / 1000;

    this.systems.forEach((system) => system.update(context, dt));
  }

  // A fresh start: no time owed, and every system's own memory of the last run forgotten.
  public reset(): void {
    this.accumulated = 0;
    this.systems.forEach((system) => system.reset?.());
  }
}

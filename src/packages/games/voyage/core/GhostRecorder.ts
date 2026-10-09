import { VoyagePhase } from "../domain/events";
import { GHOST_STRIDE, GhostRun } from "../domain/ghost";

const PHASES: readonly VoyagePhase[] = ["solar", "singularity", "lost", "universe"];

// How often the ship is sampled, and the longest run kept (an hour at that rate).
const EVERY_MS = 200;
const MAX_SAMPLES = (60 * 60 * 1000) / EVERY_MS;

// Where the ship is, as one number: the phase and the universe.
export const placeCode = (phase: VoyagePhase, universe: number): number => PHASES.indexOf(phase) * 1000 + universe + 1;

// Records where the ship flies, a few times a second, into a ghost to fly beside next time.
export class GhostRecorder {
  private samples: number[] = [];
  private nextAt = 0;

  public reset(): void {
    this.samples = [];
    this.nextAt = 0;
  }

  public sample(elapsedMs: number, x: number, y: number, angle: number, place: number): void {
    while (elapsedMs >= this.nextAt && this.samples.length / GHOST_STRIDE < MAX_SAMPLES) {
      this.samples.push(x, y, angle, place);
      this.nextAt += EVERY_MS;
    }
  }

  public finish(day: string, score: number): GhostRun {
    return { day, score, every: EVERY_MS, samples: [...this.samples] };
  }
}

// Where a ghost is at a moment of its run: between its two nearest samples, if it was where `place` says; null
// when it was somewhere else then, or its run had ended.
export const ghostAt = (run: GhostRun, elapsedMs: number, place: number): { x: number; y: number; angle: number } | null => {
  const at = elapsedMs / run.every;
  const index = Math.floor(at);
  const next = index + 1;
  const count = run.samples.length / GHOST_STRIDE;

  if (index < 0 || next >= count) {
    return null;
  }

  const a = index * GHOST_STRIDE;
  const b = next * GHOST_STRIDE;

  if (run.samples[a + 3] !== place || run.samples[b + 3] !== place) {
    return null;
  }

  const t = at - index;
  const turn = Math.atan2(Math.sin(run.samples[b + 2] - run.samples[a + 2]), Math.cos(run.samples[b + 2] - run.samples[a + 2]));

  return {
    x: run.samples[a] + (run.samples[b] - run.samples[a]) * t,
    y: run.samples[a + 1] + (run.samples[b + 1] - run.samples[a + 1]) * t,
    angle: run.samples[a + 2] + turn * t,
  };
};

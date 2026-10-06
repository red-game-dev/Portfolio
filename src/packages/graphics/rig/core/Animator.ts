import { RandomSource } from "@/packages/math/random";

import { RigAnimator } from "../domain/types";

interface Cue {
  startedAt: number;
  durationMs: number;
}

interface Repeat {
  name: string;
  minMs: number;
  maxMs: number;
  durationMs: number;
  nextAt: number;
}

// The clock and the cues of one actor: one shot cues ("talk" for a second) and cues that repeat at random
// intervals ("blink" every few seconds). Time only moves through advance(), and randomness only comes
// from the injected source, so an actor replays exactly in tests.
export class Animator implements RigAnimator {
  private readonly random: RandomSource;
  private readonly cues = new Map<string, Cue>();
  private readonly repeats: Repeat[] = [];
  private elapsed = 0;

  constructor(random: RandomSource = Math.random) {
    this.random = random;
  }

  public get timeMs(): number {
    return this.elapsed;
  }

  public play(name: string, durationMs: number): void {
    this.cues.set(name, { startedAt: this.elapsed, durationMs });
  }

  public every(name: string, minMs: number, maxMs: number, durationMs: number): this {
    this.repeats.push({ name, minMs, maxMs, durationMs, nextAt: this.elapsed + this.delay(minMs, maxMs) });

    return this;
  }

  public advance(deltaMs: number): void {
    this.elapsed += deltaMs;
    this.repeats.forEach((repeat) => {
      if (this.elapsed >= repeat.nextAt) {
        this.play(repeat.name, repeat.durationMs);
        repeat.nextAt = this.elapsed + this.delay(repeat.minMs, repeat.maxMs);
      }
    });
  }

  public progress(name: string): number | null {
    const cue = this.cues.get(name);

    if (!cue) {
      return null;
    }

    const t = (this.elapsed - cue.startedAt) / cue.durationMs;

    return t >= 0 && t < 1 ? t : null;
  }

  private delay(minMs: number, maxMs: number): number {
    return minMs + this.random() * (maxMs - minMs);
  }
}

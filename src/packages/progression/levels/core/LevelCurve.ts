import { LevelCurveSpec, LevelStanding } from "../domain/types";

// A levelling curve from 1 to its cap, with nothing in it about what levels: a pilot, a weapon, anything. The total
// experience each level starts at is worked out once, so reading a standing is a short search, not a sum.
export class LevelCurve {
  public readonly cap: number;
  // The experience each level starts at: level 1 at 0.
  private readonly starts: readonly number[];

  constructor({ cap, base, growth }: LevelCurveSpec) {
    if (!Number.isInteger(cap) || cap < 1 || base <= 0 || growth < 0) {
      throw new Error("A level curve needs a whole cap of 1 or more, a positive base and a growth of 0 or more");
    }

    const starts = [0, 0];

    for (let level = 1; level < cap; level += 1) {
      starts.push(starts[level] + this.ask(level, base, growth));
    }

    this.cap = cap;
    this.starts = starts;
  }

  // The experience a level starts at.
  public startOf(level: number): number {
    return this.starts[Math.max(1, Math.min(this.cap, Math.floor(level)))];
  }

  // What reaching the next level from this one asks; nothing at the cap.
  public toNext(level: number): number {
    const at = Math.max(1, Math.min(this.cap, Math.floor(level)));

    return at >= this.cap ? 0 : this.starts[at + 1] - this.starts[at];
  }

  // Where a total stands.
  public standing(experience: number): LevelStanding {
    const total = Math.max(0, experience);
    let low = 1;
    let high = this.cap;

    while (low < high) {
      const middle = Math.ceil((low + high) / 2);

      if (this.starts[middle] <= total) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    const toNext = this.toNext(low);
    const into = total - this.starts[low];

    return { level: low, into: toNext > 0 ? into : 0, toNext, share: toNext > 0 ? into / toNext : 1, isCapped: low >= this.cap };
  }

  public levelOf(experience: number): number {
    return this.standing(experience).level;
  }

  private ask(level: number, base: number, growth: number): number {
    return Math.max(1, Math.round(base * level ** growth));
  }
}

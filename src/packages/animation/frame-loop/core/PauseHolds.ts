// The things that hold a loop still while they are open, a map or a menu over a game, counted together: the loop
// pauses when the first takes hold, if it was running, and goes on only when the last lets go, and only if they
// paused it. A loop someone paused for themselves stays paused when they all close.
export class PauseHolds {
  private readonly holders = new Set<string>();
  private isHolding = false;

  public get isHeld(): boolean {
    return this.holders.size > 0;
  }

  // `holder` takes hold; returns whether the loop should pause now.
  public take(holder: string, isRunning: boolean): boolean {
    const isFirst = this.holders.size === 0;

    this.holders.add(holder);

    if (isFirst && isRunning) {
      this.isHolding = true;

      return true;
    }

    return false;
  }

  // `holder` lets go; returns whether the loop should go on now.
  public release(holder: string): boolean {
    if (!this.holders.delete(holder) || this.holders.size > 0 || !this.isHolding) {
      return false;
    }

    this.isHolding = false;

    return true;
  }

  // Everyone lets go at once, without the loop going on: a new run starts from its own state.
  public clear(): void {
    this.holders.clear();
    this.isHolding = false;
  }
}

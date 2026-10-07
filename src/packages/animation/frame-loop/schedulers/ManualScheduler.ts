import { FrameScheduler } from "../domain/types";

// Frames advance only when `tick` is called, with whatever timestamp the caller chooses. Makes loops
// deterministic for tests, replays and rendering frames offline.
export class ManualScheduler implements FrameScheduler {
  private readonly callbacks = new Map<number, (time: number) => void>();
  private nextHandle = 1;

  public get pendingCount(): number {
    return this.callbacks.size;
  }

  public request(callback: (time: number) => void): number {
    const handle = this.nextHandle;

    this.nextHandle += 1;
    this.callbacks.set(handle, callback);

    return handle;
  }

  public cancel(handle: number): void {
    this.callbacks.delete(handle);
  }

  // Runs every callback that was waiting when the tick began. Callbacks they schedule wait for the next tick.
  public tick(time: number): void {
    const pending = [...this.callbacks.values()];

    this.callbacks.clear();
    pending.forEach((callback) => callback(time));
  }
}

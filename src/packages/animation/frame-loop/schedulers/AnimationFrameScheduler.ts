import { FrameScheduler } from "../domain/types";

export class AnimationFrameScheduler implements FrameScheduler {
  public request(callback: (time: number) => void): number {
    return requestAnimationFrame(callback);
  }

  public cancel(handle: number): void {
    cancelAnimationFrame(handle);
  }
}

import { PinchTracker } from "@/packages/interaction/gestures";

import { ZoomDirection, ZoomInputOptions } from "../domain/types";

// One zoom from every way of asking for it: a wheel or a trackpad's scroll, two fingers pinching, and keys such as
// + and -. Each answers a factor to multiply the zoom by, so the host keeps its own range and easing.
export class ZoomInput {
  private readonly options: ZoomInputOptions;
  private readonly pinch = new PinchTracker();

  constructor(options: ZoomInputOptions) {
    this.options = options;
  }

  // How many pointers are on the surface.
  public get pointers(): number {
    return this.pinch.count;
  }

  // A wheel's vertical travel (a wheel event's deltaY).
  public wheel(deltaY: number): number {
    return Math.exp(-deltaY * this.options.wheel);
  }

  // One key's step in (1) or out (-1).
  public step(direction: ZoomDirection): number {
    return direction > 0 ? this.options.step : 1 / this.options.step;
  }

  // Where pointer `id` is now. Null while fewer than two are down (one pointer is not a pinch, so the host can steer
  // or drag with it); during a pinch, the factor since the last reading, 1 when there is nothing to apply yet.
  public track(id: number, x: number, y: number): number | null {
    return this.pinch.track(id, x, y);
  }

  // A pointer lifted or gone.
  public release(id: number): void {
    this.pinch.release(id);
  }

  public clear(): void {
    this.pinch.clear();
  }
}

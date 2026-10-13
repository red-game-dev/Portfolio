import { PinchTracker } from "@/packages/interaction/gestures";

import { ZoomDirection, ZoomInputOptions } from "../domain/types";

// A wheel's travel in lines or in pages (its deltaMode 1 and 2, as a mouse wheel reports in some browsers), in pixels.
const LINE_PIXELS = 16;
const PAGE_PIXELS = 800;

// One zoom from every way of asking for it: a wheel or a trackpad's scroll, a trackpad's pinch, two fingers
// pinching on a touch screen, and keys such as + and -. Each answers a factor to multiply the zoom by, so the host
// keeps its own range and easing.
export class ZoomInput {
  private readonly options: ZoomInputOptions;
  private readonly pinch = new PinchTracker();
  private gestureScale = 1;

  constructor(options: ZoomInputOptions) {
    this.options = options;
  }

  // How many pointers are on the surface.
  public get pointers(): number {
    return this.pinch.count;
  }

  // Whether two or more pointers are down: a pinch, not one pointer for the host to steer or drag with.
  public get isPinching(): boolean {
    return this.pinch.isPinching;
  }

  // A wheel's vertical travel (a wheel event's deltaY, in its deltaMode's units). A trackpad's pinch comes as a wheel
  // with the control key held (`isPinch`), in steps too small for the wheel's rate.
  public wheel(deltaY: number, deltaMode = 0, isPinch = false): number {
    const pixels = deltaY * (deltaMode === 1 ? LINE_PIXELS : deltaMode === 2 ? PAGE_PIXELS : 1);

    return Math.exp(-pixels * (isPinch ? this.options.pinch : this.options.wheel));
  }

  // Safari's own trackpad pinch: its gesture's scale since it began (1 at the start), as the factor since the last
  // reading. `begin` starts a gesture afresh.
  public gesture(scale: number, begin = false): number {
    const last = begin ? 1 : this.gestureScale;

    this.gestureScale = scale > 0 ? scale : last;

    return this.gestureScale / last;
  }

  // One key's step in (1) or out (-1).
  public step(direction: ZoomDirection): number {
    return direction > 0 ? this.options.step : 1 / this.options.step;
  }

  // Where pointer `id` is now: the factor a pinch zooms by since the last reading, or null when there is nothing to
  // apply (one pointer, or the first reading of a pinch).
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

import { Direction } from "../domain/types";
import { swipeDirection } from "../utils/pointer";

// Turns a horizontal swipe of a finger or a pen into a step back or forward, right to left going forward. A mouse is
// left out: it drags to select text, and has buttons to click instead.
export class SwipeTracker {
  private readonly threshold: number;
  private from: number | null = null;

  // A swipe must travel further than `threshold` pixels to count.
  constructor(threshold: number) {
    this.threshold = threshold;
  }

  // A pointer going down at `x`, of a pointer event's type ("mouse", "touch" or "pen").
  public start(x: number, pointerType: string): void {
    this.from = pointerType === "mouse" ? null : x;
  }

  // The pointer lifted at `x`: which way the swipe turns, or null when it was too short or no swipe began.
  public end(x: number): Direction | null {
    if (this.from === null) {
      return null;
    }

    const direction = swipeDirection(x - this.from, this.threshold);

    this.from = null;

    return direction;
  }
}

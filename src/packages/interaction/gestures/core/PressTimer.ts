import { PressKind } from "../domain/types";

// Tells a tap from a hold by how long a press lasts, for a control that does one thing when tapped and keeps doing
// another while held (a launch button that charges while held and launches by itself when tapped). Times are in ms
// on any one clock, such as an event's timeStamp.
export class PressTimer {
  private readonly tapMs: number;
  private pressedAt: number | null = null;

  constructor(tapMs: number) {
    this.tapMs = tapMs;
  }

  public get isPressed(): boolean {
    return this.pressedAt !== null;
  }

  public press(at: number): void {
    this.pressedAt = at;
  }

  // The press let go at `at`: a tap if it lasted less than the tap time, else a hold. Null when nothing was pressed.
  public release(at: number): PressKind | null {
    if (this.pressedAt === null) {
      return null;
    }

    const heldMs = at - this.pressedAt;

    this.pressedAt = null;

    return heldMs < this.tapMs ? "tap" : "hold";
  }

  // The press abandoned (the pointer cancelled or taken away): it ends as neither.
  public cancel(): void {
    this.pressedAt = null;
  }
}

import { Point } from "../domain/types";

// Follows one pointer dragging across a surface and says how far it moved since the last reading, to look round a
// view or carry something along with the pointer.
export class DragTracker {
  private x = 0;
  private y = 0;
  private isActive = false;

  public get isDragging(): boolean {
    return this.isActive;
  }

  public start(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.isActive = true;
  }

  // Where the pointer is now. Returns how far it moved since the last reading, or null when no drag is under way.
  public move(x: number, y: number): Point | null {
    if (!this.isActive) {
      return null;
    }

    const moved = { x: x - this.x, y: y - this.y };

    this.x = x;
    this.y = y;

    return moved;
  }

  public end(): void {
    this.isActive = false;
  }
}

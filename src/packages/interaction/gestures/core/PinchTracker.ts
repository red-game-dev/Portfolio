import { Point } from "../domain/types";

// Follows the pointers on a surface by id and, while two or more are down, how far apart the first two are, so
// spreading or closing them can zoom. A pointer is tracked from its first reading until it is released, and a
// reading allocates nothing once the pointer is known.
export class PinchTracker {
  private readonly points = new Map<number, Point>();
  // Ids in the order they were first read, so the first two stay the pinch's two.
  private readonly order: number[] = [];
  private spread = 0;

  // How many pointers are tracked.
  public get count(): number {
    return this.order.length;
  }

  // Where pointer `id` is now. Returns null while fewer than two pointers are down; during a pinch, the factor the
  // spread changed by since the last reading: 1 on the first reading of a pinch, or while the two touch.
  public track(id: number, x: number, y: number): number | null {
    const point = this.points.get(id);

    if (point) {
      point.x = x;
      point.y = y;
    } else {
      this.points.set(id, { x, y });
      this.order.push(id);
    }

    const first = this.points.get(this.order[0]);
    const second = this.order.length > 1 ? this.points.get(this.order[1]) : undefined;

    if (!first || !second) {
      return null;
    }

    const spread = Math.hypot(first.x - second.x, first.y - second.y);
    const factor = this.spread > 0 && spread > 0 ? spread / this.spread : 1;

    this.spread = spread;

    return factor;
  }

  // A pointer lifted or gone. With fewer than two left, the next pinch starts afresh.
  public release(id: number): void {
    const index = this.order.indexOf(id);

    if (index >= 0) {
      this.order.splice(index, 1);
      this.points.delete(id);
    }

    if (this.order.length < 2) {
      this.spread = 0;
    }
  }

  public clear(): void {
    this.points.clear();
    this.order.length = 0;
    this.spread = 0;
  }
}

import { FieldSample, GravitySource } from "../domain/types";

export const createFieldSample = (): FieldSample => ({ ax: 0, ay: 0, magnitude: 0, dominant: -1, dominantPull: 0, dominantDistance: Infinity });

// Newtonian gravity from any number of point masses: each pulls with mu / r^2 towards itself. Inside a body the
// distance is floored at its surface, so nothing passing close is flung to infinity. Sampling writes into a
// reused object and allocates nothing, so it can run for every body at a fixed step.
export class GravityField {
  private sources: readonly GravitySource[] = [];

  public get size(): number {
    return this.sources.length;
  }

  public setSources(sources: readonly GravitySource[]): void {
    this.sources = sources;
  }

  public sample(x: number, y: number, out: FieldSample): FieldSample {
    out.ax = 0;
    out.ay = 0;
    out.dominant = -1;
    out.dominantPull = 0;
    out.dominantDistance = Infinity;

    for (let index = 0; index < this.sources.length; index += 1) {
      const source = this.sources[index];
      const dx = source.x - x;
      const dy = source.y - y;
      const distance = Math.hypot(dx, dy);

      if (distance === 0) {
        continue;
      }

      const floored = Math.max(distance, source.radius);
      const pull = source.mu / (floored * floored);

      out.ax += (dx / distance) * pull;
      out.ay += (dy / distance) * pull;

      if (pull > out.dominantPull) {
        out.dominant = index;
        out.dominantPull = pull;
        out.dominantDistance = distance;
      }
    }

    out.magnitude = Math.hypot(out.ax, out.ay);

    return out;
  }
}

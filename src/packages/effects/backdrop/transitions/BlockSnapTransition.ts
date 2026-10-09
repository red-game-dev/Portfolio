import { Canvas2DContext } from "@/packages/graphics/canvas";
import { mixRgb, Rgb, rgba } from "@/packages/graphics/colour";
import { clamp01 } from "@/packages/math/clamp";
import { easeInOut, pulse } from "@/packages/math/easing";

import { SceneSize, SceneTransition } from "../domain/types";

export interface BlockSnapTransitionOptions {
  from: Rgb;
  to: Rgb;
  // Grid pitch in CSS pixels.
  cell: number;
}

// AI into the chain: the network's nodes snap onto a grid and harden into blocks, in a sweep from the top
// left. One path per frame, however many blocks.
export class BlockSnapTransition implements SceneTransition {
  private readonly options: BlockSnapTransitionOptions;
  private columns = 0;
  private rows = 0;

  constructor(options: BlockSnapTransitionOptions) {
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    this.columns = Math.ceil(width / this.options.cell);
    this.rows = Math.ceil(height / this.options.cell);
  }

  public draw(context: Canvas2DContext, progress: number): void {
    const { cell } = this.options;
    const strength = pulse(progress);

    context.strokeStyle = rgba(mixRgb(this.options.from, this.options.to, easeInOut(progress)), strength * 0.75);
    context.lineWidth = 1.5;
    context.beginPath();

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        // Each block arrives a little after the one above and to its left.
        const local = clamp01(progress * 1.8 - (column / Math.max(1, this.columns)) * 0.55 - (row / Math.max(1, this.rows)) * 0.3);
        const size = cell * 0.62 * pulse(local);

        if (size > 1) {
          const centreX = column * cell + cell / 2;
          const centreY = row * cell + cell / 2;

          context.rect(centreX - size / 2, centreY - size / 2, size, size);
        }
      }
    }

    context.stroke();
  }
}

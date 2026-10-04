import { Canvas2DContext, CanvasRenderer } from "@/packages/graphics/canvas";

import { BackdropFrame } from "../domain/types";

// Paints the background once, then each active scene at its crossfade alpha.
export class SceneCompositor extends CanvasRenderer<BackdropFrame> {
  constructor(context: Canvas2DContext, background: string) {
    super(context, { background });
  }

  public draw(frame: BackdropFrame, now: number): void {
    this.clear();

    frame.layers.forEach(({ scene, alpha }) => {
      if (alpha > 0.001) {
        scene.draw(this.context, alpha, now);
      }
    });

    this.context.globalAlpha = 1;
  }
}

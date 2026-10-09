import { RenderLayer, Viewport } from "../domain/types";

// Draws a frame as a stack of layers, back to front: each knows only its own part (the sky, the planets, the
// ships, the effects), so a new kind of thing is a new layer, not an edit to a long draw method.
export class RenderPipeline<TFrame> {
  private readonly layers: ReadonlyArray<RenderLayer<TFrame>>;

  constructor(layers: ReadonlyArray<RenderLayer<TFrame>>) {
    this.layers = layers;
  }

  public resize(viewport: Viewport, pixelRatio: number): void {
    this.layers.forEach((layer) => layer.resize?.(viewport, pixelRatio));
  }

  public draw(frame: TFrame): void {
    this.layers.forEach((layer) => layer.draw(frame));
  }
}

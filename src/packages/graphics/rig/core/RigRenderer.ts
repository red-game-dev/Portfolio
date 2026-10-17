import { Canvas2DContext, SpriteCache, SpriteCacheOptions } from "@/packages/graphics/canvas";
import { clamp } from "@/packages/math/clamp";

import { RigCamera, RigChannels, RigLayer, RigModel, RigSkin } from "../domain/types";

// The camera kept on the model: never zoomed out past the whole box, never looking past its edges.
export const keepCamera = (camera: RigCamera, width: number, height: number): RigCamera => {
  const zoom = Math.max(1, camera.zoom);
  const halfWidth = width / (2 * zoom);
  const halfHeight = height / (2 * zoom);

  return { x: clamp(camera.x, halfWidth, width - halfWidth), y: clamp(camera.y, halfHeight, height - halfHeight), zoom };
};

// Draws a model the way a game engine draws a skinned sprite: every layer is painted once per skin and
// step of the channels it depends on, into a SpriteCache at device resolution (sharp enough for the
// camera's closest zoom), and then only blitted, with its motion applied as a transform and the camera's
// over it. Many actors share one renderer per model and size.
export class RigRenderer<TSkin extends RigSkin> {
  private readonly model: RigModel<TSkin>;
  private readonly sprites: SpriteCache;
  private readonly layersById: Map<string, RigLayer<TSkin>>;
  private scale = 1;

  constructor(model: RigModel<TSkin>, options: Pick<SpriteCacheOptions, "maxEntries" | "createSurface"> = {}) {
    this.model = model;
    this.sprites = new SpriteCache({ width: model.width, height: model.height, scale: 1, ...options });
    this.layersById = new Map(model.layers.map((layer) => [layer.id, layer]));
  }

  public get cachedFrames(): number {
    return this.sprites.size;
  }

  // Device pixels per model unit.
  public rescale(scale: number): void {
    this.scale = scale;
    this.sprites.rescale(scale * Math.max(1, this.model.maxZoom ?? 1));
  }

  public frameKey(skin: TSkin, layer: RigLayer<TSkin>, channels: RigChannels): string {
    const source = this.sourceOf(layer);
    const keyChannels = typeof source.keyChannels === "function" ? source.keyChannels(skin) : source.keyChannels ?? [];

    return [this.model.id, skin.id, source.id, ...keyChannels.map((channel) => channels[channel] ?? 0)].join(":");
  }

  public draw(context: Canvas2DContext, skin: TSkin, channels: RigChannels): void {
    const { scale, model } = this;
    const camera = model.camera ? keepCamera(model.camera(channels), model.width, model.height) : null;

    model.layers.forEach((layer) => {
      const { x = 0, y = 0, rotate = 0, scale: grow = 1, opacity = 1, pivot = { x: 0, y: 0 } } = layer.motion?.(channels) ?? {};

      if (opacity <= 0) {
        return;
      }

      context.save();

      if (camera && !layer.isFixed) {
        context.translate((model.width / 2) * scale, (model.height / 2) * scale);
        context.scale(camera.zoom, camera.zoom);
        context.translate(-camera.x * scale, -camera.y * scale);
      }

      if (opacity < 1) {
        context.globalAlpha = opacity;
      }

      context.translate((pivot.x + x) * scale, (pivot.y + y) * scale);
      context.rotate(rotate);

      if (grow !== 1) {
        context.scale(grow, grow);
      }

      const source = this.sourceOf(layer);

      if (source.cache === false) {
        context.scale(scale, scale);
        context.translate(-pivot.x, -pivot.y);
        source.paint(context, skin, channels);
      } else {
        const bounds = source.bounds ?? { x: 0, y: 0, width: model.width, height: model.height };
        const frame = this.sprites.get(this.frameKey(skin, layer, channels), (target) => source.paint(target, skin, channels), bounds);

        if (frame) {
          context.drawImage(frame, (bounds.x - pivot.x) * scale, (bounds.y - pivot.y) * scale, bounds.width * scale, bounds.height * scale);
        }
      }

      context.restore();
    });
  }

  // The layer whose artwork a layer draws: its own, or the one it shares.
  private sourceOf(layer: RigLayer<TSkin>): RigLayer<TSkin> {
    return layer.cacheAs ? this.layersById.get(layer.cacheAs) ?? layer : layer;
  }
}

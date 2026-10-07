import { Canvas2DContext, SpriteCache, SpriteCacheOptions } from "@/packages/graphics/canvas";

import { RigChannels, RigLayer, RigModel, RigSkin } from "../domain/types";

// Draws a model the way a game engine draws a skinned sprite: every layer is painted once per skin and
// step of the channels it depends on, into a SpriteCache at device resolution, and then only blitted,
// with its motion applied as a transform. Many actors share one renderer per model and size.
export class RigRenderer<TSkin extends RigSkin> {
  private readonly model: RigModel<TSkin>;
  private readonly sprites: SpriteCache;
  private scale = 1;

  constructor(model: RigModel<TSkin>, options: Pick<SpriteCacheOptions, "maxEntries" | "createSurface"> = {}) {
    this.model = model;
    this.sprites = new SpriteCache({ width: model.width, height: model.height, scale: 1, ...options });
  }

  public get cachedFrames(): number {
    return this.sprites.size;
  }

  // Device pixels per model unit.
  public rescale(scale: number): void {
    this.scale = scale;
    this.sprites.rescale(scale);
  }

  public frameKey(skin: TSkin, layer: RigLayer<TSkin>, channels: RigChannels): string {
    const keyChannels = typeof layer.keyChannels === "function" ? layer.keyChannels(skin) : layer.keyChannels ?? [];

    return [this.model.id, skin.id, layer.id, ...keyChannels.map((channel) => channels[channel] ?? 0)].join(":");
  }

  public draw(context: Canvas2DContext, skin: TSkin, channels: RigChannels): void {
    const { scale } = this;

    this.model.layers.forEach((layer) => {
      const { x = 0, y = 0, rotate = 0, pivot = { x: 0, y: 0 } } = layer.motion?.(channels) ?? {};

      context.save();
      context.translate((pivot.x + x) * scale, (pivot.y + y) * scale);
      context.rotate(rotate);

      if (layer.cache === false) {
        context.scale(scale, scale);
        context.translate(-pivot.x, -pivot.y);
        layer.paint(context, skin, channels);
      } else {
        const bounds = layer.bounds ?? { x: 0, y: 0, width: this.model.width, height: this.model.height };
        const frame = this.sprites.get(this.frameKey(skin, layer, channels), (target) => layer.paint(target, skin, channels), bounds);

        if (frame) {
          context.drawImage(frame, (bounds.x - pivot.x) * scale, (bounds.y - pivot.y) * scale, bounds.width * scale, bounds.height * scale);
        }
      }

      context.restore();
    });
  }
}

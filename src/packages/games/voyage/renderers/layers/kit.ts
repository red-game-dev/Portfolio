import { DrawableSurface } from "@/packages/graphics/canvas";
import type { GlobeRenderer } from "@/packages/graphics/globe";

import { VoyageTheme } from "../../config";
import { ParticleSystem } from "../ParticleSystem";
import { Surface } from "../Surface";
import { Paint, SurfaceCache } from "../SurfaceCache";

// Sprites never paint larger than this many device pixels across; bigger draws scale them up. Planets are smooth
// enough that it cannot be seen, and it keeps a close Jupiter from costing tens of megabytes.
const MAX_SPRITE = 1600;

// What every layer shares: the back and front surfaces, the sprite cache, the particles, the theme, the GPU's
// globes and what each place is called.
export class RenderKit {
  constructor(
    public readonly back: Surface,
    public readonly front: Surface,
    public readonly cache: SurfaceCache,
    public readonly particles: ParticleSystem,
    public readonly theme: VoyageTheme,
    public readonly globes: GlobeRenderer,
    public readonly labels: Record<string, string>,
  ) {}

  // A sprite `width` by `height` CSS pixels at zoom 1, painted once at device resolution (capped).
  public sprite(key: string, width: number, height: number, paint: Paint): DrawableSurface | null {
    const scale = Math.min(this.back.pixelRatio, MAX_SPRITE / Math.max(width, height, 1));

    return this.cache.get(key, width * scale, height * scale, paint);
  }

  // A tile repeated over a surface, shifted so it streams past as the camera moves.
  public tile(surface: Surface, drawable: DrawableSurface | null, size: number, offsetX: number, offsetY: number, alpha: number): void {
    if (!drawable) {
      return;
    }

    const left = (offsetX % size) - size;
    const top = (offsetY % size) - size;

    surface.context.globalAlpha = alpha;

    for (let y = top; y < surface.height; y += size) {
      for (let x = left; x < surface.width; x += size) {
        surface.context.drawImage(drawable.surface, x, y, size, size);
      }
    }

    surface.context.globalAlpha = 1;
  }
}

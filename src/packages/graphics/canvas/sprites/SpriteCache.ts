import { Canvas2DContext, CanvasSurface } from "../domain/types";
import { createDrawableSurface, DrawableSurface } from "../utils/surface";

export interface SpriteCacheOptions {
  // The artwork's own size, in the units it is painted in.
  width: number;
  height: number;
  // Device pixels per unit: the drawn size times the pixel ratio.
  scale: number;
  // Least recently used frames are dropped past this many.
  maxEntries?: number;
  createSurface?: (width: number, height: number) => DrawableSurface | null;
}

const DEFAULT_MAX_ENTRIES = 96;

// Painted once, blitted every frame: detailed vector artwork (a character, a prop) is drawn into an
// offscreen surface the first time a frame is asked for, at the exact device resolution it will be shown
// at, and reused after. A frame costs one drawImage however much detail it holds, so many characters can
// share a screen. Frames are keyed by the caller ("head:red:open:closed"), and the cache is rebuilt when
// the scale changes.
export class SpriteCache {
  private readonly width: number;
  private readonly height: number;
  private readonly maxEntries: number;
  private readonly createSurface: (width: number, height: number) => DrawableSurface | null;
  private readonly frames = new Map<string, CanvasSurface>();
  private scale: number;

  constructor({ width, height, scale, maxEntries = DEFAULT_MAX_ENTRIES, createSurface = createDrawableSurface }: SpriteCacheOptions) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.maxEntries = maxEntries;
    this.createSurface = createSurface;
  }

  public get size(): number {
    return this.frames.size;
  }

  public rescale(scale: number): void {
    if (scale !== this.scale) {
      this.scale = scale;
      this.frames.clear();
    }
  }

  public get(key: string, paint: (context: Canvas2DContext) => void): CanvasSurface | null {
    const cached = this.frames.get(key);

    if (cached) {
      // Touch it, so the least recently used frame is the first in line to go.
      this.frames.delete(key);
      this.frames.set(key, cached);

      return cached;
    }

    const drawable = this.createSurface(Math.ceil(this.width * this.scale), Math.ceil(this.height * this.scale));

    if (!drawable) {
      return null;
    }

    drawable.context.scale(this.scale, this.scale);
    paint(drawable.context);
    this.frames.set(key, drawable.surface);

    if (this.frames.size > this.maxEntries) {
      const oldest = this.frames.keys().next().value;

      if (oldest !== undefined) {
        this.frames.delete(oldest);
      }
    }

    return drawable.surface;
  }

  public clear(): void {
    this.frames.clear();
  }
}

import { Canvas2DContext, createDrawableSurface, DrawableSurface } from "@/packages/graphics/canvas";

// Paints into a surface of `width` by `height` device pixels.
export type Paint = (context: Canvas2DContext, width: number, height: number) => void;

// Artwork painted once at device resolution and blitted after: a planet, a rock, a disk of gas. Keyed by the
// caller with everything that changes how it looks, its size included, and emptied when the screen or its
// pixel ratio changes.
export class SurfaceCache {
  private readonly surfaces = new Map<string, DrawableSurface | null>();

  public get(key: string, width: number, height: number, paint: Paint): DrawableSurface | null {
    const cached = this.surfaces.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const drawable = createDrawableSurface(Math.max(1, Math.ceil(width)), Math.max(1, Math.ceil(height)));

    if (drawable) {
      paint(drawable.context, drawable.surface.width, drawable.surface.height);
    }

    this.surfaces.set(key, drawable);

    return drawable;
  }

  // Lets go of one surface no longer needed, such as the sky of a universe left behind.
  public delete(key: string): void {
    this.surfaces.delete(key);
  }

  public clear(): void {
    this.surfaces.clear();
  }
}

import { Canvas2DContext, CanvasSurface, DrawableSurface } from "@/packages/graphics/canvas";

// One drawing surface: its context, sized for the device's pixels with coordinates in CSS pixels, and the few
// drawing operations every layer shares, done without save and restore on the hot path.
export class Surface {
  public readonly context: Canvas2DContext;
  public width = 0;
  public height = 0;
  public pixelRatio = 1;

  constructor(context: Canvas2DContext) {
    this.context = context;
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.context.canvas.width = Math.max(1, Math.floor(width * pixelRatio));
    this.context.canvas.height = Math.max(1, Math.floor(height * pixelRatio));
    this.reset();
  }

  public reset(): void {
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = "source-over";
  }

  public fill(colour: string): void {
    this.reset();
    this.context.fillStyle = colour;
    this.context.fillRect(0, 0, this.width, this.height);
  }

  public clear(): void {
    this.reset();
    this.context.clearRect(0, 0, this.width, this.height);
  }

  // A sprite centred at x, y (CSS pixels), `width` by `height`, turned by `angle` and stretched along its own axes.
  public blit(drawable: DrawableSurface | null, x: number, y: number, width: number, height: number, angle = 0): void {
    if (!drawable) {
      return;
    }

    const surface: CanvasSurface = drawable.surface;

    if (angle === 0) {
      this.context.drawImage(surface, x - width / 2, y - height / 2, width, height);

      return;
    }

    const ratio = this.pixelRatio;
    const cos = Math.cos(angle) * ratio;
    const sin = Math.sin(angle) * ratio;

    this.context.setTransform(cos, sin, -sin, cos, x * ratio, y * ratio);
    this.context.drawImage(surface, -width / 2, -height / 2, width, height);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // Moves the origin to x, y turned by `angle`, scaled by sx along the turned x and sy along the turned y, for
  // drawing in something's own frame. `reset` puts it back.
  public frame(x: number, y: number, angle: number, sx = 1, sy = 1): void {
    const ratio = this.pixelRatio;
    const cos = Math.cos(angle) * ratio;
    const sin = Math.sin(angle) * ratio;

    this.context.setTransform(cos * sx, sin * sx, -sin * sy, cos * sy, x * ratio, y * ratio);
  }
}

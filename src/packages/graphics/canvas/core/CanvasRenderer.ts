import { Canvas2DContext, CanvasRendererOptions, CanvasSize } from "../domain/types";

// Owns the drawing surface: a backing store sized for the device pixel ratio, coordinates kept in CSS
// pixels, and one clear or fill per frame. Subclasses draw their own state on top.
export abstract class CanvasRenderer<TState> {
  protected readonly context: Canvas2DContext;
  protected readonly background: string | null;
  protected size: CanvasSize = { width: 0, height: 0 };
  protected pixelRatio = 1;

  constructor(context: Canvas2DContext, { background }: CanvasRendererOptions = {}) {
    this.context = context;
    this.background = background ?? null;
  }

  public resizeSurface(width: number, height: number, pixelRatio = 1): void {
    this.size = { width, height };
    this.pixelRatio = pixelRatio;
    // Assigning width or height resets the context state, so the transform is set again after it.
    this.context.canvas.width = Math.floor(width * pixelRatio);
    this.context.canvas.height = Math.floor(height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  protected clear(): void {
    if (this.background === null) {
      this.context.clearRect(0, 0, this.size.width, this.size.height);

      return;
    }

    this.context.fillStyle = this.background;
    this.context.fillRect(0, 0, this.size.width, this.size.height);
  }

  public abstract draw(state: TState, now: number): void;
}

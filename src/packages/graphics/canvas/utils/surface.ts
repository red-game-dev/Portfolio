import { Canvas2DContext, CanvasSurface } from "../domain/types";

export interface DrawableSurface {
  surface: CanvasSurface;
  context: Canvas2DContext;
}

const createOffscreen = (width: number, height: number): DrawableSurface | null => {
  if (typeof OffscreenCanvas === "undefined") {
    return null;
  }

  const surface = new OffscreenCanvas(width, height);
  const context = surface.getContext("2d");

  return context ? { surface, context } : null;
};

const createDetached = (width: number, height: number): DrawableSurface | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const surface = document.createElement("canvas");

  surface.width = width;
  surface.height = height;

  const context = surface.getContext("2d");

  return context ? { surface, context } : null;
};

// An off-DOM canvas for caching artwork, with its 2D context. Prefers OffscreenCanvas (also available
// in workers) and falls back to a detached <canvas>, which covers browsers that expose OffscreenCanvas
// without a 2D context, such as Safari before 16.4.
export const createDrawableSurface = (width: number, height: number): DrawableSurface | null => (
  createOffscreen(width, height) ?? createDetached(width, height)
);

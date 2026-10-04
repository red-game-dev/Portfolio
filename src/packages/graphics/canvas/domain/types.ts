// Both kinds of 2D context, so the same renderer can draw on the main thread or inside a worker on an
// OffscreenCanvas transferred from the page.
export type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type CanvasSurface = HTMLCanvasElement | OffscreenCanvas;

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasRendererOptions {
  // An opaque fill per frame. Pair it with getContext("2d", { alpha: false }) so the compositor can skip
  // blending the canvas with the page. Leave it out for a transparent canvas.
  background?: string;
}

export interface GlyphStyle {
  // Cache key. Two styles with the same key must look the same.
  key: string;
  color: string;
  glowColor?: string;
  // Glow radius in CSS pixels. Baked into the sprite once, never blurred per frame.
  glowBlur?: number;
}

export interface GlyphMetrics {
  font: string;
  cellWidth: number;
  cellHeight: number;
  pixelRatio: number;
}

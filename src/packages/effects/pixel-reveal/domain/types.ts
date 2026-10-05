import { CanvasSize } from "@/packages/graphics/canvas";

export type PixelRevealStage = "binary" | "pixels" | "enhance" | "done";

// Where the reveal is at one moment. Progress runs 0 to 1 within the current stage.
export interface PixelRevealFrame {
  stage: PixelRevealStage;
  progress: number;
  // The mosaic block size in CSS pixels, during the pixel stage.
  blockSize: number;
}

export interface PixelRevealRenderer {
  resize(size: CanvasSize, pixelRatio: number): void;
  draw(frame: PixelRevealFrame, now: number): void;
}

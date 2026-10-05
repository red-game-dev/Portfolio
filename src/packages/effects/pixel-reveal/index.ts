export { DEFAULT_PIXEL_REVEAL_CONFIG, resolvePixelRevealConfig } from "./config";
export { PixelRevealEngine } from "./core/PixelRevealEngine";
export { CanvasPixelRevealRenderer } from "./renderers/CanvasPixelRevealRenderer";
export { glyphFor, luminanceOf } from "./utils/luminance";
export { frameAt, totalDuration } from "./utils/timeline";
export type { PixelRevealConfig, PixelRevealConfigOverrides, PixelRevealTheme } from "./config";
export type { PixelRevealOptions } from "./core/PixelRevealEngine";
export type { PixelRevealFrame, PixelRevealRenderer, PixelRevealStage } from "./domain/types";
export type { PixelRevealSource } from "./renderers/CanvasPixelRevealRenderer";

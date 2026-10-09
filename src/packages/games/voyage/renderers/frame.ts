import type { Camera } from "@/packages/games/engine";

import { VoyageConfig, VoyageTheme, VoyageUniverseTheme } from "../config";
import { VoyageWorld } from "../core/world";
import { Body } from "../domain/components";
import { VoyageState } from "../domain/state";

// Everything a layer needs to draw one frame.
export interface VoyageFrame {
  state: Readonly<VoyageState>;
  world: VoyageWorld;
  camera: Camera;
  config: VoyageConfig;
  theme: VoyageTheme;
  // ms on the frame clock, seconds since the last frame, and how far between the last two steps the present is.
  now: number;
  dt: number;
  alpha: number;
  universe: VoyageUniverseTheme | null;
  // Whether the GPU lens draws the black holes' shadows this frame, or the layers must.
  isLensed: boolean;
}

// Where a body is now, between its last two steps.
export const lerpX = (body: Body, alpha: number) => body.prevX + (body.x - body.prevX) * alpha;

export const lerpY = (body: Body, alpha: number) => body.prevY + (body.y - body.prevY) * alpha;

// Sizes are painted once at zoom 1 and only scaled after, so the speed zoom never repaints a sprite.
export const SIZE_STEP = 2;

export const sizeBucket = (pixels: number) => Math.max(SIZE_STEP, Math.round(pixels / SIZE_STEP) * SIZE_STEP);

export const universeOf = (state: Readonly<VoyageState>, theme: VoyageTheme): VoyageUniverseTheme | null => (
  state.phase === "universe" && state.universe >= 0 ? theme.universes[state.universe % theme.universes.length] ?? null : null
);

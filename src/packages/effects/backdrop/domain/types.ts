import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

export interface SceneSize {
  width: number;
  height: number;
  pixelRatio: number;
}

// One full screen effect. The engine owns the canvas and the clock; a scene only keeps its own state
// and draws it at the alpha it is given, so two scenes can crossfade.
export interface Scene {
  readonly id: string;
  resize(size: SceneSize): void;
  update(deltaMs: number, now: number): void;
  draw(context: Canvas2DContext, alpha: number, now: number): void;
}

export type SceneFactory = (random: RandomSource) => Scene;

export interface BackdropFrame {
  layers: Array<{ scene: Scene; alpha: number }>;
}

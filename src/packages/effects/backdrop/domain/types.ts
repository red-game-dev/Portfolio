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

// A one off effect drawn over the crossfade from one scene to another, so crossing a zone feels like the
// world changing rather than one picture fading into the next. `progress` runs from 0 to 1.
export interface SceneTransition {
  resize(size: SceneSize): void;
  draw(context: Canvas2DContext, progress: number, now: number): void;
}

export type TransitionFactory = (random: RandomSource) => SceneTransition;

export const transitionKey = (from: string, to: string) => `${from}>${to}`;

export interface BackdropFrame {
  layers: Array<{ scene: Scene; alpha: number }>;
  overlay?: { transition: SceneTransition; progress: number };
}

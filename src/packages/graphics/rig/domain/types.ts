import type { Canvas2DContext } from "@/packages/graphics/canvas";

// Channel values for one moment: breath, blink step, mouth step, glow step and so on. Layers that look
// different per channel name them in `keyChannels`, and those channels must be whole steps, since each
// step is a cached frame.
export type RigChannels = Record<string, number>;

export interface RigPoint {
  x: number;
  y: number;
}

// How a cached layer moves as it is drawn, so the motion never has to be painted into it.
export interface RigMotion {
  x?: number;
  y?: number;
  rotate?: number;
  pivot?: RigPoint;
}

// A skin is the data that dresses a model: an outfit, a class, a palette. Only its id is required.
export interface RigSkin {
  id: string;
}

export interface RigLayer<TSkin extends RigSkin> {
  id: string;
  // The channels this layer is cached by, fixed or per skin (a sequin dress twinkles, a satin one does not).
  keyChannels?: string[] | ((skin: TSkin) => string[]);
  // The part of the model the layer covers, so its cached frames are only that big. The whole box if left out.
  bounds?: { x: number; y: number; width: number; height: number };
  // False for cheap procedural layers (a glow, a gradient) that are painted live every frame instead of
  // cached, which also lets them follow a channel smoothly rather than in steps.
  cache?: boolean;
  paint(context: Canvas2DContext, skin: TSkin, channels: RigChannels): void;
  motion?(channels: RigChannels): RigMotion;
}

// What drives the channels: the time, and the cues the animator is playing.
export interface RigCues {
  // 0 to 1 through a cue that is playing, or null when it is not.
  progress(name: string): number | null;
}

// A model: its drawing box, its layers back to front, and how its channels follow time and cues.
export interface RigModel<TSkin extends RigSkin> {
  id: string;
  width: number;
  height: number;
  layers: Array<RigLayer<TSkin>>;
  channels(timeMs: number, cues: RigCues): RigChannels;
  // The model's idle life, set up on every actor that uses it: blinking, breathing cues and the like.
  setup?(animator: RigAnimator): void;
}

export interface RigAnimator extends RigCues {
  play(name: string, durationMs: number): void;
  every(name: string, minMs: number, maxMs: number, durationMs: number): RigAnimator;
}

import { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb } from "@/packages/graphics/colour";

// A world's air as the eye sees it from the ground: the sky straight up and at the horizon by day, the glow round
// a low sun, the sky at night, how strongly it scatters light at all (Earth's 1, a thin or dusty sky less), and
// how much haze hides the sun's disc and the stars (Venus's clouds 1).
export interface Air {
  zenith: string;
  horizon: string;
  dusk: string;
  night: string;
  strength: number;
  haze: number;
}

// The shape the ground takes: open sea, flat plains, dunes, rolling hills, mountains, cratered regolith, cracked
// ice, or hills under forest.
export type Relief = "sea" | "flat" | "dunes" | "hills" | "mountains" | "craters" | "ice" | "forest";

export interface Ground {
  relief: Relief;
  // The ground's own colour near by, and the land on the far horizon before the air tints it.
  colour: string;
  far: string;
  // Boulders scattered near by.
  hasRocks: boolean;
  seed: number;
}

// Something large in the sky: a planet over its moon, a moon over its planet. Elevation in degrees over the
// horizon; side from -1 (left edge) to 1 (right edge); angular radius in degrees; how much of the face is lit (0
// new, 1 full), and from which side the light comes (-1 left, 1 right).
export interface SkyBody {
  elevation: number;
  side: number;
  radius: number;
  colour: string;
  lit: number;
  lightSide: number;
  hasRings: boolean;
}

export interface Sun {
  elevation: number;
  side: number;
  // Angular radius in degrees: larger close to a star, a point far out.
  radius: number;
  colour: string;
}

export interface Scene {
  air: Air | null;
  sun: Sun | null;
  bodies: SkyBody[];
  ground: Ground;
}

// What the sky comes to at one moment: its colours straight up and at the horizon, the glow on the sun's side,
// how bright the stars show (0 to 1) and how much light falls on the ground (0 to 1).
export interface SkyLight {
  zenith: Rgb;
  horizon: Rgb;
  glow: Rgb;
  glowStrength: number;
  stars: number;
  light: number;
}

// Where to paint: the horizon's height on the canvas (CSS pixels), how much sky the canvas spans from top to bottom
// (degrees), and how far the land has dropped below the horizon line as the eye climbs (pixels, 0 on the ground).
export interface Frame {
  context: Canvas2DContext;
  width: number;
  height: number;
  horizon: number;
  fieldOfView: number;
  drop: number;
  // How much the air thins with height, 1 on the ground, 0 in space.
  density: number;
  now: number;
}

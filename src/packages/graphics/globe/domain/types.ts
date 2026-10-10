import type { Canvas2DContext } from "@/packages/graphics/canvas";

// How a surface is made when there is no map for it (or until the map arrives): each kind is its own noise
// recipe over the sphere, coloured from a palette that runs from low ground (or deep cloud) to high.
export type SurfaceKind =
  | "rocky"
  | "cratered"
  | "icy"
  | "volcanic"
  | "terran"
  | "desert"
  | "lava"
  | "gas"
  | "iceGiant"
  | "haze"
  | "toxic"
  | "rogue"
  | "eyeball"
  | "hotJupiter";

export interface GlobeSurface {
  kind: SurfaceKind;
  // Four colours, low to high, as hex.
  palette: [string, string, string, string];
  seed: number;
  // Texture ids handed to the renderer with `setTexture`: a day map, city lights for the night side, clouds.
  map?: string;
  night?: string;
  clouds?: string;
  // The longitude (degrees east) at the centre column of the maps.
  centreLongitude?: number;
  // Recipe knobs, each 0 to 1: how much is sea, how many bands, how turbulent, how far the ice caps reach.
  sea?: number;
  bands?: number;
  turbulence?: number;
  caps?: number;
  // Whether the sea shows the Sun's glint.
  glint?: boolean;
}

export interface GlobeAtmosphere {
  colour: string;
  // How far it reaches above the surface, as a share of the radius, and how thick it looks (0 to 1).
  thickness: number;
  density: number;
  // The colour of the band along the terminator, where light crosses the most air.
  sunset?: string;
}

// Rings, in the body's radii, lit by the same light and shadowed by the body (and shadowing it).
export interface GlobeRings {
  inner: number;
  outer: number;
  colour: string;
  opacity: number;
  seed: number;
}

export interface GlobeLook {
  surface: GlobeSurface;
  atmosphere?: GlobeAtmosphere;
  rings?: GlobeRings;
  // Cloud cover over the map (0 to 1), and how fast it drifts against the ground (radians per second).
  clouds?: number;
  cloudDrift?: number;
}

// A scar from an impact, on the body: where (degrees), how wide (degrees of arc), and how hot it still is.
export interface GlobeCrater {
  longitude: number;
  latitude: number;
  size: number;
  heat: number;
}

// How a globe sits against its light: the screen angle from it towards the light (canvas angles, y down), the
// point on it under the light (degrees), and how far above its equator the viewer looks from (degrees). Its
// north is drawn a quarter turn from the light; `isTurned` puts it on the other side, so it can stay nearer the
// top of the screen whichever side the light comes from (see `northUp`).
export interface GlobePose {
  lightAngle: number;
  subsolarLatitude: number;
  subsolarLongitude: number;
  viewElevation: number;
  isTurned: boolean;
  // For a body that keeps one face to another: the screen angle its longitude 0 faces, which then sets how it
  // turns instead of `subsolarLongitude`.
  facing?: number;
}

export interface GlobeDraw {
  // The disc's centre and radius, in CSS pixels on the target.
  x: number;
  y: number;
  radius: number;
  look: GlobeLook;
  pose: GlobePose;
  // Seconds, for drifting clouds and flickering aurora.
  time: number;
  // How bright its light is here, 0 to 1 (a world far from its star, or a rogue with none, is dim).
  light: number;
  aurora: number;
  craters: readonly GlobeCrater[];
}

export interface StarLook {
  temperatureK: number;
  // How strong the boiling granulation, the sunspots and the corona are, 0 to 1.
  granulation: number;
  spots: number;
  corona: number;
  seed: number;
}

export interface StarDraw {
  x: number;
  y: number;
  radius: number;
  look: StarLook;
  time: number;
  // A flare at a screen angle on the limb, with its strength 0 to 1.
  flare: { angle: number; strength: number } | null;
}

// Draws globes and stars into a 2D target. A GPU renderer draws each one fresh every frame, only the part on
// screen, at the target's resolution; the canvas fallback does what it can without WebGL.
export interface GlobeRenderer {
  readonly isGpu: boolean;
  readonly available: boolean;
  resize(width: number, height: number, pixelRatio: number): void;
  setTexture(id: string, image: TexImageSource): void;
  hasTexture(id: string): boolean;
  drawGlobe(target: Canvas2DContext, draw: GlobeDraw): void;
  drawStar(target: Canvas2DContext, draw: StarDraw): void;
  // How much detail the noise has (octaves, 1 to 5): fewer on a device that cannot keep up.
  setDetail(octaves: number): void;
  dispose(): void;
}

import { hexToRgb, mixRgb, Rgb } from "@/packages/graphics/colour";
import { GifFrame, GifImage } from "@/packages/graphics/gif";
import { clamp } from "@/packages/math/clamp";
import { easeInOut, smoothstep } from "@/packages/math/easing";

// The email's top bar as an image, for the mail apps that play no CSS motion (Gmail among them) but do play a GIF: its
// size as drawn (shown twice as wide, which a smooth gradient loses nothing by), the bar's height inside it, a glow
// filling the rest, and how long the motion runs.
export const CONTACT_ART = {
  width: 300,
  height: 16,
  bar: 3,
  durationMs: 2400,
  frameMs: 40,
} as const;

// The palette, every colour the art uses: a step along the colours the light passes through, times a step of light,
// from the panel itself (0) through the colour (1) to the colour lit towards white. The glow fades through the low
// steps, the bar sits at 1, and the light passing lifts it through the top ones.
const HUES = 21;
const LIGHTS = [0, 0.02, 0.05, 0.09, 0.14, 0.2, 0.27, 0.35, 1, 1.1, 1.2, 1.3];
const WHITE: Rgb = [255, 255, 255];
const WHITE_MOST = 0.5;

// The light's half width, as a share of the bar, and where its centre starts and ends (off the bar on either side, so
// the first frame and the last are the bar at rest).
const HALF = 0.32;
const FROM = -HALF - 0.1;
const TO = 1 + HALF + 0.1;

// How bright the glow is a row below the bar, from its brightest under the bar to nothing at the art's foot, so the
// last row is the panel itself and the art meets it without a seam.
const glowAt = (depth: number) => 0.3 * (1 - depth) ** 2;

// The colours the light passes through, starting from the accent: the journey's colours in order away from it (the
// whole journey from either end, or the accent and then the journey where it sits elsewhere or nowhere in it).
const pathFrom = (accent: string, journey: readonly string[]): Rgb[] => {
  const at = journey.indexOf(accent);
  const path = at === 0 ? journey : at === journey.length - 1 ? [...journey].reverse() : [accent, ...journey.filter((colour) => colour !== accent)];

  return path.map(hexToRgb);
};

const along = (path: Rgb[], share: number): Rgb => {
  const place = clamp(share, 0, 1) * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(place));

  return mixRgb(path[index], path[index + 1], place - index);
};

const paletteOf = (path: Rgb[], panel: Rgb): Rgb[] => Array.from({ length: HUES }, (_, hue) => along(path, hue / (HUES - 1)))
  .flatMap((colour) => LIGHTS.map((light) => (light <= 1 ? mixRgb(panel, colour, light) : mixRgb(colour, WHITE, ((light - 1) / 0.3) * WHITE_MOST))));

// The nearest step of light to any light, looked up a thousandth at a time rather than searched for every pixel, the
// table built on first use (this module reaches the page through the package's entry, and the page never draws).
const FINEST = 1000;
const BRIGHTEST = LIGHTS[LIGHTS.length - 1];
let nearest: Uint8Array | null = null;

const nearestLight = (light: number) => {
  nearest ??= Uint8Array.from({ length: Math.round(BRIGHTEST * FINEST) + 1 }, (_, fine) =>
    LIGHTS.reduce((best, level, index) => (Math.abs(level - fine / FINEST) < Math.abs(LIGHTS[best] - fine / FINEST) ? index : best), 0));

  return nearest[Math.round(clamp(light, 0, BRIGHTEST) * FINEST)];
};

const indexOf = (hue: number, light: number) => Math.round(clamp(hue, 0, 1) * (HUES - 1)) * LIGHTS.length + nearestLight(light);

// A row softened by a box blur run twice, so the glow under the bar spreads like light rather than in steps: a running
// total over the window, its ends held at the row's own ends.
const softened = (row: Float32Array, radius: number): Float32Array => {
  const pass = (from: Float32Array) => {
    const last = from.length - 1;
    const to = new Float32Array(from.length);
    let total = 0;

    for (let offset = -radius; offset <= radius; offset += 1) {
      total += from[clamp(offset, 0, last)];
    }

    for (let x = 0; x < from.length; x += 1) {
      to[x] = total / (radius * 2 + 1);
      total += from[Math.min(last, x + radius + 1)] - from[Math.max(0, x - radius)];
    }

    return to;
  };

  return pass(pass(row));
};

// One frame: the light's centre where the motion has it, the bar taking the light's colours (from the accent at its
// edges to the far end of the path at its heart) and a little more light, and the glow under it following.
const frameAt = (progress: number): Uint8Array => {
  const { width, height, bar } = CONTACT_ART;
  const centre = FROM + easeInOut(progress) * (TO - FROM);
  const hue = new Float32Array(width);
  const light = new Float32Array(width);

  for (let x = 0; x < width; x += 1) {
    const inside = smoothstep(0, 1, 1 - Math.abs((x / (width - 1) - centre) / HALF));

    hue[x] = inside;
    light[x] = 1 + 0.3 * inside;
  }

  const glow = softened(light, 9);
  const indices = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const depth = (y - bar + 1) / (height - bar);

    for (let x = 0; x < width; x += 1) {
      indices[y * width + x] = indexOf(hue[x], y < bar ? light[x] : glowAt(depth) * glow[x]);
    }
  }

  return indices;
};

// The art for one accent over the panel it sits on: a light passes once along the bar through the journey's colours
// and leaves it the accent again, in under the five seconds past which WCAG 2.2.2 asks for a way to stop it; and the bar
// at rest alone, for a reader who asked for less motion.
export const contactArt = (accent: string, journey: readonly string[], panel: string): { moving: GifImage; still: GifImage } => {
  const { width, height, durationMs, frameMs } = CONTACT_ART;
  const palette = paletteOf(pathFrom(accent, journey), hexToRgb(panel));
  const count = Math.round(durationMs / frameMs);
  const frames: GifFrame[] = Array.from({ length: count + 1 }, (_, index) => ({ indices: frameAt(index / count), delayMs: frameMs }));

  return {
    moving: { width, height, palette, frames },
    still: { width, height, palette, frames: [frames[0]] },
  };
};

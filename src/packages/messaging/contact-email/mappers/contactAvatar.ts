import { frameAt, PixelRevealConfig, PixelRevealRaster, RasterPixelRevealRenderer, resolvePixelRevealConfig, totalDuration } from "@/packages/effects/pixel-reveal";
import { hexToRgb, Rgb } from "@/packages/graphics/colour";
import { GifFrame, GifImage, quantize } from "@/packages/graphics/gif";
import { clamp01 } from "@/packages/math/clamp";

// The portrait beside the email's header: shown at half the size it is drawn, for sharp screens.
export const CONTACT_AVATAR = {
  shown: 48,
  // The accent ring round it, in pixels as drawn, so the round shape shows against a dark picture on a dark panel.
  ring: 2,
} as const;

// The site's portrait reveal, scaled to a small round picture: the glyph cells and mosaic steps in pixels as drawn.
const REVEAL: Partial<PixelRevealConfig> = { binaryCell: 8, blockSizes: [16, 10, 6, 4, 2] };

// The moments the animation keeps: each flicker of the binary, the mosaic often enough to catch every step and the
// binary fading off it, and the scanline in small steps, then the picture.
const STEPS: Record<"binary" | "pixels" | "enhance", number> = { binary: 110, pixels: 100, enhance: 50 };

const momentsOf = (config: PixelRevealConfig): number[] => {
  const { binaryMs, pixelsMs } = config;
  const end = totalDuration(config);
  const moments: number[] = [];

  for (let at = 0; at < end; at += at < binaryMs ? STEPS.binary : at < binaryMs + pixelsMs ? STEPS.pixels : STEPS.enhance) {
    moments.push(at);
  }

  return [...moments, end];
};

// A frame made round: the accent ring at its edge, and the panel outside it, each edge softened by how much of the
// pixel it covers.
const rounded = (pixels: Uint8Array, size: number, accent: Rgb, panel: Rgb): Uint8Array => {
  const out = new Uint8Array(pixels.length);
  const radius = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const from = Math.hypot(x + 0.5 - radius, y + 0.5 - radius);
      const ring = clamp01(from - (radius - CONTACT_AVATAR.ring) + 0.5) * 0.85;
      const inside = clamp01(radius - from + 0.5);
      const offset = (y * size + x) * 3;

      for (let channel = 0; channel < 3; channel += 1) {
        const lit = pixels[offset + channel] + (accent[channel] - pixels[offset + channel]) * ring;

        out[offset + channel] = Math.round(panel[channel] + (lit - panel[channel]) * inside);
      }
    }
  }

  return out;
};

// The portrait revealed as the site reveals it (binary lit by the picture's brightness, a mosaic sharpening, a
// scanline enhancing it), round, ringed in the accent and set on the panel, played once in under the five seconds
// past which WCAG 2.2.2 asks for a way to stop it; and the finished portrait alone, for a reader who asked for less
// motion and for the mail apps that show a GIF's first frame only. The portrait must be square.
export const contactAvatar = (portrait: PixelRevealRaster, accent: string, panel: string): { moving: GifImage; still: GifImage } => {
  const config = resolvePixelRevealConfig({ ...REVEAL, theme: { background: panel, signal: accent } });
  const renderer = new RasterPixelRevealRenderer(portrait, config);
  const size = portrait.width;
  const accentRgb = hexToRgb(accent);
  const panelRgb = hexToRgb(panel);
  const moments = momentsOf(config);
  const drawn = moments.map((at) => {
    renderer.draw(frameAt(at, config), at);

    return rounded(renderer.pixels, size, accentRgb, panelRgb);
  });
  const { palette, frames } = quantize(drawn, { fixed: [panelRgb] });
  // Each frame shows until the next moment; the last, the picture, stays once the animation stops.
  const moving: GifFrame[] = frames.map((indices, index) => ({ indices, delayMs: (moments[index + 1] ?? moments[index] + STEPS.enhance) - moments[index] }));

  return {
    moving: { width: size, height: size, palette, frames: moving },
    still: { width: size, height: size, palette, frames: [moving[moving.length - 1]] },
  };
};

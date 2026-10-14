import { frameAt, PixelRevealConfig, resolvePixelRevealConfig, totalDuration } from "@/packages/effects/pixel-reveal";
import { PixelRevealRaster, RasterPixelRevealRenderer } from "@/packages/effects/pixel-reveal-raster";
import { hexToRgb } from "@/packages/graphics/colour";
import { GifFrame, GifImage, quantize } from "@/packages/graphics/gif";

// The portrait beside the email's header, the whole picture as the site's own reveal shows it: shown at half the size it
// is drawn, for sharp screens.
export const CONTACT_PORTRAIT = {
  width: 96,
  height: 128,
} as const;

// The site's portrait reveal at the email's size: the glyph cells and mosaic steps in pixels as drawn, the site's own
// scaled to a picture three fifths as wide.
const REVEAL: Partial<PixelRevealConfig> = { binaryCell: 8, blockSizes: [24, 14, 10, 6, 4] };

// The moments the animation keeps, as few as still read as the site's: the binary flickering every other beat, the
// mosaic once a step (each step its own sharpening, the binary fading off it), and the scanline in small steps, then the
// picture. A frame of the binary or the mosaic changes every pixel, so each costs as much as the picture itself.
const STEPS: Record<"binary" | "pixels" | "enhance", number> = { binary: 160, pixels: 280, enhance: 70 };

const momentsOf = (config: PixelRevealConfig): number[] => {
  const { binaryMs, pixelsMs } = config;
  const end = totalDuration(config);
  const moments: number[] = [];

  for (let at = 0; at < end; at += at < binaryMs ? STEPS.binary : at < binaryMs + pixelsMs ? STEPS.pixels : STEPS.enhance) {
    moments.push(at);
  }

  return [...moments, end];
};

// The portrait revealed as the site reveals it (binary lit by the picture's brightness, a mosaic sharpening, a
// scanline enhancing it), on the panel, played once in under the five seconds past which WCAG 2.2.2 asks for a way to
// stop it; and the finished portrait alone, for a reader who asked for less motion and for the mail apps that show a
// GIF's first frame only.
export const contactPortrait = (portrait: PixelRevealRaster, accent: string, panel: string): { moving: GifImage; still: GifImage } => {
  const config = resolvePixelRevealConfig({ ...REVEAL, theme: { background: panel, signal: accent } });
  const renderer = new RasterPixelRevealRenderer(portrait, config);
  const { width, height } = portrait;
  const moments = momentsOf(config);
  const drawn = moments.map((at) => {
    renderer.draw(frameAt(at, config), at);

    return renderer.pixels.slice();
  });
  const { palette, frames } = quantize(drawn, { fixed: [hexToRgb(panel)] });
  // Each frame shows until the next moment; the last, the picture, stays once the animation stops.
  const moving: GifFrame[] = frames.map((indices, index) => ({ indices, delayMs: (moments[index + 1] ?? moments[index] + STEPS.enhance) - moments[index] }));

  return {
    moving: { width, height, palette, frames: moving },
    still: { width, height, palette, frames: [moving[moving.length - 1]] },
  };
};

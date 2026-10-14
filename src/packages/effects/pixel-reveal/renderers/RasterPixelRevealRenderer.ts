import type { CanvasSize } from "@/packages/graphics/canvas";
import { hexToRgb, Rgb } from "@/packages/graphics/colour";

import { PixelRevealConfig } from "../config";
import { PixelRevealFrame, PixelRevealRenderer } from "../domain/types";
import { glyphFor, luminanceOf } from "../utils/luminance";

// A picture as raw pixels, three bytes a pixel (red, green, blue), row by row.
export interface PixelRevealRaster {
  width: number;
  height: number;
  pixels: Uint8Array;
}

// The binary glyphs as five by seven bitmaps, drawn a pixel of the glyph to as many of the cell as fit.
const GLYPHS: Record<"0" | "1", string[]> = {
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
};

// As the canvas renderer: where the binary stage starts handing over to colour, how faint the darkest glyph is, and
// the sparks along the enhance scanline; its glow a tenth of the picture tall.
const BINARY_HANDOVER = 0.55;
const GLYPH_FLOOR = 0.12;
const SPARKS = 14;

// The same reveal as `CanvasPixelRevealRenderer`, drawn into raw pixels instead of a canvas, for places with no canvas
// at all (a server drawing an email's animation frame by frame): binary glyphs lit by the picture's brightness, a mosaic
// that sharpens step by step, then a scanline that enhances it to the full picture. `pixels` holds the frame drawn last.
export class RasterPixelRevealRenderer implements PixelRevealRenderer {
  public pixels: Uint8Array;
  private readonly source: PixelRevealRaster;
  private readonly config: PixelRevealConfig;
  private readonly background: Rgb;
  private readonly signal: Rgb;
  private readonly spark: Rgb;
  private size: CanvasSize;
  private picture: Uint8Array;
  private brightness: ArrayLike<number> = [];
  private mosaics = new Map<number, Uint8Array>();

  constructor(source: PixelRevealRaster, config: PixelRevealConfig) {
    this.source = source;
    this.config = config;
    this.background = hexToRgb(config.theme.background);
    this.signal = hexToRgb(config.theme.signal);
    this.spark = hexToRgb(config.theme.spark);
    this.size = { width: source.width, height: source.height };
    this.picture = source.pixels;
    this.pixels = new Uint8Array(source.pixels.length);
    this.resize(this.size);
  }

  // Draws at a size of its own, the picture sampled to it; a pixel ratio means nothing to raw pixels.
  public resize(size: CanvasSize): void {
    const width = Math.max(1, Math.round(size.width));
    const height = Math.max(1, Math.round(size.height));

    this.size = { width, height };
    this.picture = this.sampled(width, height);
    this.pixels = new Uint8Array(width * height * 3);
    this.mosaics.clear();
    this.brightness = this.cellBrightness();
  }

  public draw(frame: PixelRevealFrame, now: number): void {
    this.fill(this.background, 1);

    switch (frame.stage) {
      case "binary":
        this.drawBinary(now, 1);

        if (frame.progress > BINARY_HANDOVER) {
          this.drawMosaic(frame.blockSize, ((frame.progress - BINARY_HANDOVER) / (1 - BINARY_HANDOVER)) * 0.6);
        }

        break;
      case "pixels":
        this.drawMosaic(frame.blockSize, 1);
        this.drawBinary(now, (1 - frame.progress) * 0.35);
        break;
      case "enhance":
        this.drawMosaic(frame.blockSize, 1);
        this.drawEnhance(frame.progress, now);
        break;
      default:
        this.pixels.set(this.picture);
    }
  }

  // One pixel's colour laid over what is there at an opacity.
  private blend(index: number, colour: Rgb, alpha: number) {
    this.blendFrom(index, colour, 0, alpha);
  }

  // The same, the colour read from three bytes of another buffer, so a whole picture blends without a colour per pixel.
  private blendFrom(index: number, from: ArrayLike<number>, start: number, alpha: number) {
    const offset = index * 3;

    for (let channel = 0; channel < 3; channel += 1) {
      this.pixels[offset + channel] = Math.round(this.pixels[offset + channel] + (from[start + channel] - this.pixels[offset + channel]) * alpha);
    }
  }

  private fill(colour: Rgb, alpha: number) {
    for (let index = 0; index < this.size.width * this.size.height; index += 1) {
      this.blend(index, colour, alpha);
    }
  }

  private drawBinary(now: number, opacity: number): void {
    if (opacity <= 0) {
      return;
    }

    const { width, height } = this.size;
    const { binaryCell, flickerMs } = this.config;
    const columns = Math.max(1, Math.floor(width / binaryCell));
    const rows = Math.max(1, Math.floor(height / binaryCell));
    const scale = Math.max(1, Math.floor(binaryCell / 7));
    const left = Math.floor((binaryCell - 5 * scale) / 2);
    const top = Math.floor((binaryCell - 7 * scale) / 2);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const cell = row * columns + column;
        const alpha = opacity * (GLYPH_FLOOR + (1 - GLYPH_FLOOR) * this.brightness[cell]);
        const glyph = GLYPHS[glyphFor(cell, now, flickerMs)];

        for (let y = 0; y < 7 * scale; y += 1) {
          for (let x = 0; x < 5 * scale; x += 1) {
            const px = column * binaryCell + left + x;
            const py = row * binaryCell + top + y;

            if (glyph[Math.floor(y / scale)][Math.floor(x / scale)] === "#" && px < width && py < height) {
              this.blend(py * width + px, this.signal, Math.min(1, alpha));
            }
          }
        }
      }
    }
  }

  private drawMosaic(blockSize: number, opacity: number): void {
    if (opacity <= 0) {
      return;
    }

    const mosaic = this.mosaicOf(blockSize);

    for (let index = 0; index < this.size.width * this.size.height; index += 1) {
      this.blendFrom(index, mosaic, index * 3, Math.min(1, opacity));
    }
  }

  // The full picture above the scanline, a glow trailing it, the line itself and sparks where it is working.
  private drawEnhance(progress: number, now: number): void {
    const { width, height } = this.size;
    const scanY = Math.round(height * progress);
    const glow = Math.max(4, Math.round(height / 10));

    this.pixels.set(this.picture.subarray(0, scanY * width * 3));

    for (let y = Math.max(0, scanY - glow); y < scanY; y += 1) {
      for (let x = 0; x < width; x += 1) {
        this.blend(y * width + x, this.signal, 0.35 * (1 - (scanY - y) / glow));
      }
    }

    for (let y = Math.max(0, scanY - 1); y < Math.min(height, scanY + 1); y += 1) {
      for (let x = 0; x < width; x += 1) {
        this.blend(y * width + x, this.spark, 1);
      }
    }

    for (let spark = 0; spark < SPARKS; spark += 1) {
      const seed = Math.abs(Math.sin(spark * 91.7 + Math.floor(now / 60) * 13.1));
      const sparkX = Math.floor((seed * 7919) % width);
      const sparkY = Math.floor(scanY - 3 + ((seed * 104729) % 6));

      for (let y = sparkY; y < sparkY + 2; y += 1) {
        for (let x = sparkX; x < Math.min(width, sparkX + 2); x += 1) {
          if (y >= 0 && y < height) {
            this.blend(y * width + x, this.spark, 0.4 + 0.6 * seed);
          }
        }
      }
    }
  }

  // The picture as blocks, each the average of the pixels it covers, worked out once per block size.
  private mosaicOf(blockSize: number): Uint8Array {
    const cached = this.mosaics.get(blockSize);

    if (cached) {
      return cached;
    }

    const { width, height } = this.size;
    const block = Math.max(1, Math.round(blockSize));
    const mosaic = new Uint8Array(width * height * 3);

    for (let top = 0; top < height; top += block) {
      for (let left = 0; left < width; left += block) {
        const sums = [0, 0, 0];
        let count = 0;

        for (let y = top; y < Math.min(height, top + block); y += 1) {
          for (let x = left; x < Math.min(width, left + block); x += 1) {
            for (let channel = 0; channel < 3; channel += 1) {
              sums[channel] += this.picture[(y * width + x) * 3 + channel];
            }

            count += 1;
          }
        }

        for (let y = top; y < Math.min(height, top + block); y += 1) {
          for (let x = left; x < Math.min(width, left + block); x += 1) {
            for (let channel = 0; channel < 3; channel += 1) {
              mosaic[(y * width + x) * 3 + channel] = Math.round(sums[channel] / count);
            }
          }
        }
      }
    }

    this.mosaics.set(blockSize, mosaic);

    return mosaic;
  }

  // Brightness per glyph cell, from the cell's mosaic block.
  private cellBrightness(): ArrayLike<number> {
    const { width, height } = this.size;
    const { binaryCell } = this.config;
    const columns = Math.max(1, Math.floor(width / binaryCell));
    const rows = Math.max(1, Math.floor(height / binaryCell));
    const mosaic = this.mosaicOf(binaryCell);
    const rgba = new Uint8Array(columns * rows * 4);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const offset = ((row * binaryCell) * width + column * binaryCell) * 3;

        rgba.set([mosaic[offset], mosaic[offset + 1], mosaic[offset + 2], 255], (row * columns + column) * 4);
      }
    }

    this.mosaics.delete(binaryCell);

    return luminanceOf(rgba);
  }

  // The source picture at a size, each pixel the nearest of the source's.
  private sampled(width: number, height: number): Uint8Array {
    const { source } = this;

    if (width === source.width && height === source.height) {
      return source.pixels;
    }

    const out = new Uint8Array(width * height * 3);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const from = (Math.floor((y * source.height) / height) * source.width + Math.floor((x * source.width) / width)) * 3;

        out.set(source.pixels.subarray(from, from + 3), (y * width + x) * 3);
      }
    }

    return out;
  }
}

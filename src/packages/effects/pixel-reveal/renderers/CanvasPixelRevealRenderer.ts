import {
  Canvas2DContext,
  CanvasRenderer,
  CanvasSize,
  createDrawableSurface,
  DrawableSurface,
  GlyphAtlas,
  GlyphStyle
} from "@/packages/graphics/canvas";

import { PixelRevealConfig } from "../config";
import { PixelRevealFrame, PixelRevealRenderer } from "../domain/types";
import { glyphFor, luminanceOf } from "../utils/luminance";

export interface PixelRevealSource {
  image: CanvasImageSource;
  width: number;
  height: number;
}

interface LuminanceGrid {
  columns: number;
  rows: number;
  values: Float32Array;
}

// Where the binary stage starts handing over to colour.
const BINARY_HANDOVER = 0.55;
const GLYPH_FLOOR = 0.12;
const SCAN_GLOW_PX = 22;
const SPARKS = 14;

// Draws one image materialising out of its own data: binary glyphs lit by the picture's brightness, a
// mosaic that sharpens step by step, then a scanline that enhances it to full resolution. Mosaics and
// glyphs are rendered once and reused, so a frame is a few hundred drawImage calls at most.
export class CanvasPixelRevealRenderer extends CanvasRenderer<PixelRevealFrame> implements PixelRevealRenderer {
  private readonly source: PixelRevealSource;
  private readonly config: PixelRevealConfig;
  private readonly atlas = new GlyphAtlas();
  private readonly glyphStyle: GlyphStyle;
  private mosaics = new Map<number, DrawableSurface | null>();
  private grid: LuminanceGrid | null = null;

  constructor(context: Canvas2DContext, source: PixelRevealSource, config: PixelRevealConfig) {
    super(context, { background: config.theme.background });
    this.source = source;
    this.config = config;
    this.glyphStyle = { key: "signal", color: config.theme.signal, glowColor: config.theme.signal, glowBlur: 3 };
  }

  public resize(size: CanvasSize, pixelRatio: number): void {
    const ratio = Math.min(pixelRatio, this.config.maxPixelRatio);
    const { binaryCell } = this.config;

    this.resizeSurface(size.width, size.height, ratio);
    this.mosaics.clear();
    this.grid = this.sampleGrid(Math.max(1, Math.floor(size.width / binaryCell)), Math.max(1, Math.floor(size.height / binaryCell)));
    this.atlas.configure({ font: `bold ${binaryCell + 2}px monospace`, cellWidth: binaryCell, cellHeight: binaryCell, pixelRatio: ratio });
  }

  public draw(frame: PixelRevealFrame, now: number): void {
    this.clear();

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
        this.drawImage(this.size.height);
    }
  }

  private drawBinary(now: number, opacity: number): void {
    const { grid, context } = this;

    if (!grid || opacity <= 0) {
      return;
    }

    const { binaryCell, flickerMs } = this.config;

    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        const cell = row * grid.columns + column;

        context.globalAlpha = opacity * (GLYPH_FLOOR + (1 - GLYPH_FLOOR) * grid.values[cell]);
        this.atlas.draw(context, glyphFor(cell, now, flickerMs), this.glyphStyle, column * binaryCell, row * binaryCell);
      }
    }

    context.globalAlpha = 1;
  }

  private drawMosaic(blockSize: number, opacity: number): void {
    const mosaic = this.getMosaic(blockSize);

    if (!mosaic || opacity <= 0) {
      return;
    }

    this.context.globalAlpha = Math.min(1, opacity);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(mosaic.surface, 0, 0, this.size.width, this.size.height);
    this.context.imageSmoothingEnabled = true;
    this.context.globalAlpha = 1;
  }

  // The full resolution picture above the scanline, a glow trailing it, and sparks where it is working.
  private drawEnhance(progress: number, now: number): void {
    const { context, size } = this;
    const scanY = size.height * progress;

    this.drawImage(scanY);

    const glow = context.createLinearGradient(0, scanY - SCAN_GLOW_PX, 0, scanY);

    glow.addColorStop(0, "rgba(0, 0, 0, 0)");
    glow.addColorStop(1, this.config.theme.signal);
    context.globalAlpha = 0.35;
    context.fillStyle = glow;
    context.fillRect(0, scanY - SCAN_GLOW_PX, size.width, SCAN_GLOW_PX);
    context.globalAlpha = 1;
    context.fillStyle = this.config.theme.spark;
    context.fillRect(0, scanY - 1, size.width, 2);

    for (let spark = 0; spark < SPARKS; spark += 1) {
      const seed = Math.abs(Math.sin(spark * 91.7 + Math.floor(now / 60) * 13.1));

      context.globalAlpha = 0.4 + 0.6 * seed;
      context.fillRect((seed * 7919) % size.width, scanY - 6 + (seed * 104729) % 12, 2, 2);
    }

    context.globalAlpha = 1;
  }

  // The source image from the top down to `height`, scaled to the canvas.
  private drawImage(height: number): void {
    if (height <= 0) {
      return;
    }

    const { source, size } = this;
    const sourceHeight = (source.height * height) / size.height;

    this.context.drawImage(source.image, 0, 0, source.width, sourceHeight, 0, 0, size.width, height);
  }

  private getMosaic(blockSize: number): DrawableSurface | null {
    if (!this.mosaics.has(blockSize)) {
      this.mosaics.set(blockSize, this.renderMosaic(blockSize));
    }

    return this.mosaics.get(blockSize) ?? null;
  }

  // The picture shrunk to one pixel per block. Drawn back up without smoothing, each pixel becomes a block.
  private renderMosaic(blockSize: number): DrawableSurface | null {
    const drawable = createDrawableSurface(Math.max(1, Math.ceil(this.size.width / blockSize)), Math.max(1, Math.ceil(this.size.height / blockSize)));

    if (drawable) {
      drawable.context.drawImage(this.source.image, 0, 0, drawable.surface.width, drawable.surface.height);
    }

    return drawable;
  }

  // Brightness per glyph cell. A cross origin image cannot be read back, so it falls back to an even field.
  private sampleGrid(columns: number, rows: number): LuminanceGrid {
    const drawable = createDrawableSurface(columns, rows);

    try {
      if (!drawable) {
        throw new Error("No drawing surface");
      }

      drawable.context.drawImage(this.source.image, 0, 0, columns, rows);

      return { columns, rows, values: luminanceOf(drawable.context.getImageData(0, 0, columns, rows).data) };
    } catch {
      return { columns, rows, values: new Float32Array(columns * rows).fill(0.6) };
    }
  }
}

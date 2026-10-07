import { Canvas2DContext, CanvasSurface, GlyphMetrics, GlyphStyle } from "../domain/types";
import { createDrawableSurface } from "../utils/surface";

interface GlyphSprite {
  surface: CanvasSurface;
  // Space around the cell reserved for the glow, in CSS pixels.
  padding: number;
}

// Text shaping and shadow blur are the two most expensive things a 2D canvas does, and an effect that
// draws hundreds of glyphs a frame would pay for both every frame. The atlas pays once: each glyph and
// style pair is rasterised into a sprite at device resolution, glow included, and every later draw is a
// single drawImage that the GPU composites.
export class GlyphAtlas {
  private readonly sprites = new Map<string, GlyphSprite | null>();
  private metrics: GlyphMetrics | null = null;

  // Throws away every sprite when the font, cell size or pixel ratio changes, since none of them would
  // be pixel exact any more.
  public configure(metrics: GlyphMetrics): void {
    const current = this.metrics;
    const isSame = current !== null
      && current.font === metrics.font
      && current.cellWidth === metrics.cellWidth
      && current.cellHeight === metrics.cellHeight
      && current.pixelRatio === metrics.pixelRatio;

    if (!isSame) {
      this.metrics = metrics;
      this.sprites.clear();
    }
  }

  // Draws `glyph` with its cell's top left corner at (x, y), in CSS pixels.
  public draw(context: Canvas2DContext, glyph: string, style: GlyphStyle, x: number, y: number): void {
    const sprite = this.getSprite(glyph, style);

    if (!sprite || !this.metrics) {
      return;
    }

    const { cellWidth, cellHeight } = this.metrics;

    context.drawImage(
      sprite.surface,
      x - sprite.padding,
      y - sprite.padding,
      cellWidth + sprite.padding * 2,
      cellHeight + sprite.padding * 2
    );
  }

  private getSprite(glyph: string, style: GlyphStyle): GlyphSprite | null {
    const key = `${style.key}\u0000${glyph}`;

    if (!this.sprites.has(key)) {
      this.sprites.set(key, this.renderSprite(glyph, style));
    }

    return this.sprites.get(key) ?? null;
  }

  private renderSprite(glyph: string, style: GlyphStyle): GlyphSprite | null {
    if (!this.metrics) {
      return null;
    }

    const { font, cellWidth, cellHeight, pixelRatio } = this.metrics;
    const padding = Math.ceil((style.glowBlur ?? 0) * 1.5);
    const drawable = createDrawableSurface(
      Math.ceil((cellWidth + padding * 2) * pixelRatio),
      Math.ceil((cellHeight + padding * 2) * pixelRatio)
    );

    if (!drawable) {
      return null;
    }

    const { surface, context } = drawable;

    context.scale(pixelRatio, pixelRatio);
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = style.color;

    if (style.glowBlur && style.glowColor) {
      context.shadowColor = style.glowColor;
      context.shadowBlur = style.glowBlur * pixelRatio;
    }

    context.fillText(glyph, padding + cellWidth / 2, padding);

    return { surface, padding };
  }
}

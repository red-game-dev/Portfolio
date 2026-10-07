import { Canvas2DContext, CanvasRenderer, GlyphAtlas, GlyphStyle } from "@/packages/graphics/canvas";

import { RainConfig, RainConfigOverrides, resolveRainConfig } from "../config";
import { RainGrid, RainRenderer, RainState } from "../domain/types";
import { isLockedCell, isMessageComplete } from "../utils/state";

interface RainGlyphStyles {
  trail: GlyphStyle;
  head: GlyphStyle;
  letter: GlyphStyle;
  freshLetter: GlyphStyle;
}

// Every glyph is a blit from the atlas: no text shaping and no shadow blur inside the frame loop. The
// trail fades through globalAlpha on a single sprite per glyph, so the atlas stays a handful of entries.
export class CanvasRainRenderer extends CanvasRenderer<RainState> implements RainRenderer {
  private readonly config: RainConfig;
  private readonly atlas = new GlyphAtlas();
  private readonly styles: RainGlyphStyles;
  private readonly trailAlphas: number[];

  constructor(context: Canvas2DContext, overrides?: RainConfigOverrides) {
    const config = resolveRainConfig(overrides);

    super(context, { background: config.theme.background });

    const { theme, trailLevels, maxTrailAlpha } = config;

    this.config = config;
    this.styles = {
      trail: { key: "trail", color: theme.trail },
      head: { key: "head", color: theme.head, glowColor: theme.glow, glowBlur: config.headGlow },
      letter: { key: "letter", color: theme.letter, glowColor: theme.glow, glowBlur: config.letterGlow },
      freshLetter: { key: "fresh", color: theme.freshLetter, glowColor: theme.glow, glowBlur: config.freshLetterGlow },
    };
    this.trailAlphas = Array.from({ length: trailLevels + 1 }, (_, level) => (level / trailLevels) * maxTrailAlpha);
  }

  public resize(grid: RainGrid, pixelRatio: number): void {
    this.resizeSurface(grid.width, grid.height, pixelRatio);
    this.atlas.configure({
      font: `${grid.fontSize}px ${this.config.fontFamily}`,
      cellWidth: grid.cellWidth,
      cellHeight: grid.cellHeight,
      pixelRatio,
    });
  }

  public draw(state: RainState, now: number): void {
    this.clear();
    this.drawTrails(state);
    this.drawHeads(state);
    this.drawMessage(state, now);
    this.drawCaret(state, now);
  }

  private drawTrails(state: RainState): void {
    const { grid } = state;
    const { trailLevels } = this.config;

    state.columns.forEach((column, columnIndex) => {
      const head = Math.floor(column.stream.head);
      const x = columnIndex * grid.cellWidth;
      const lastRow = Math.min(head - 1, grid.rows - 1);
      const firstRow = Math.max(0, head - column.stream.length + 1);

      for (let row = lastRow; row >= firstRow; row -= 1) {
        if (!isLockedCell(state, columnIndex, row)) {
          this.context.globalAlpha = this.trailAlphas[Math.round((1 - (head - row) / column.stream.length) * trailLevels)];
          this.atlas.draw(this.context, column.glyphs[row], this.styles.trail, x, row * grid.cellHeight);
        }
      }
    });

    this.context.globalAlpha = 1;
  }

  private drawHeads(state: RainState): void {
    const { grid } = state;

    state.columns.forEach((column, columnIndex) => {
      const head = Math.floor(column.stream.head);

      if (head >= 0 && head < grid.rows && !isLockedCell(state, columnIndex, head)) {
        this.atlas.draw(this.context, column.glyphs[head], this.styles.head, columnIndex * grid.cellWidth, head * grid.cellHeight);
      }
    });
  }

  private drawMessage(state: RainState, now: number): void {
    const { grid } = state;

    state.message.forEach((cell) => {
      if (cell.lockedAt === null || cell.glyph === " ") {
        return;
      }

      const style = now - cell.lockedAt < this.config.lockFlashMs ? this.styles.freshLetter : this.styles.letter;

      this.atlas.draw(this.context, cell.glyph, style, cell.column * grid.cellWidth, cell.row * grid.cellHeight);
    });
  }

  // A blinking block in the trailing blank cell once every letter has landed, like a terminal waiting
  // for the next line.
  private drawCaret(state: RainState, now: number): void {
    const { grid } = state;
    const caretCell = state.message[state.message.length - 1];

    if (!caretCell || !isMessageComplete(state) || Math.floor(now / this.config.caretBlinkMs) % 2 === 1) {
      return;
    }

    this.context.fillStyle = this.config.theme.caret;
    this.context.fillRect(
      caretCell.column * grid.cellWidth + Math.round(grid.cellWidth * 0.2),
      caretCell.row * grid.cellHeight + Math.round(grid.cellHeight * 0.1),
      Math.round(grid.cellWidth * 0.6),
      Math.round(grid.cellHeight * 0.8)
    );
  }
}

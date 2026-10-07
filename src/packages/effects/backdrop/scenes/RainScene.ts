import {
  BinaryGlyphSource,
  createGrid,
  RainConfig,
  RainConfigOverrides,
  RainSimulation,
  resolveRainConfig
} from "@/packages/effects/binary-rain";
import { Canvas2DContext, GlyphAtlas, GlyphStyle } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface RainSceneOptions {
  color: string;
  headColor: string;
  glowColor: string;
  // Overall strength, so the rain stays behind the content.
  intensity: number;
  rain?: RainConfigOverrides;
}

// The binary rain as a quiet background: the same simulation as the headline effect, without a message,
// drawn dimmer and slower through a glyph atlas.
export class RainScene implements Scene {
  public readonly id = "matrix";
  private readonly config: RainConfig;
  private readonly random: RandomSource;
  private readonly options: RainSceneOptions;
  private readonly atlas = new GlyphAtlas();
  private readonly trailStyle: GlyphStyle;
  private readonly headStyle: GlyphStyle;
  private simulation: RainSimulation | null = null;

  constructor(random: RandomSource, options: RainSceneOptions) {
    this.random = random;
    this.options = options;
    this.config = resolveRainConfig({ narrowFontSize: 13, wideFontSize: 15, minSpeed: 4, maxSpeed: 11, ...options.rain });
    this.trailStyle = { key: "bg-trail", color: options.color };
    this.headStyle = { key: "bg-head", color: options.headColor, glowColor: options.glowColor, glowBlur: 6 };
  }

  public resize({ width, height, pixelRatio }: SceneSize): void {
    const grid = createGrid(width, height, this.config);

    this.simulation = new RainSimulation(grid, [], { config: this.config, glyphs: new BinaryGlyphSource(), random: this.random });
    this.atlas.configure({
      font: `${grid.fontSize}px ${this.config.fontFamily}`,
      cellWidth: grid.cellWidth,
      cellHeight: grid.cellHeight,
      pixelRatio,
    });
  }

  public update(deltaMs: number, now: number): void {
    this.simulation?.step(deltaMs, now);
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    if (!this.simulation) {
      return;
    }

    const { grid, columns } = this.simulation.state;
    const strength = alpha * this.options.intensity;

    columns.forEach((column, columnIndex) => {
      const head = Math.floor(column.stream.head);
      const x = columnIndex * grid.cellWidth;
      const firstRow = Math.max(0, head - column.stream.length + 1);
      const lastRow = Math.min(head - 1, grid.rows - 1);

      for (let row = lastRow; row >= firstRow; row -= 1) {
        context.globalAlpha = strength * 0.55 * (1 - (head - row) / column.stream.length);
        this.atlas.draw(context, column.glyphs[row], this.trailStyle, x, row * grid.cellHeight);
      }

      if (head >= 0 && head < grid.rows) {
        context.globalAlpha = strength;
        this.atlas.draw(context, column.glyphs[head], this.headStyle, x, head * grid.cellHeight);
      }
    });
  }
}

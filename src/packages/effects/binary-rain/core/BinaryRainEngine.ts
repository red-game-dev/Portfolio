import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { RainConfig, RainConfigOverrides, resolveRainConfig } from "../config";
import { GlyphSource, RainRenderer } from "../domain/types";
import { CanvasRainRenderer } from "../renderers/CanvasRainRenderer";
import { BinaryGlyphSource } from "../sources/BinaryGlyphSource";
import { createGrid } from "../utils/grid";
import { RainSimulation } from "./RainSimulation";

export interface BinaryRainOptions {
  message: string[];
  // Reduced motion: draw one still frame with the message already in place and never start the loop.
  isStatic?: boolean;
  config?: RainConfigOverrides;
  glyphs?: GlyphSource;
  random?: RandomSource;
  scheduler?: FrameScheduler;
}

// Glues a simulation to a renderer on the shared frame loop and handles the lifecycle around them:
// resize, decode, still frames. Every collaborator is injected, so each can be replaced or faked.
export class BinaryRainEngine extends FrameLoop {
  private readonly renderer: RainRenderer;
  private readonly config: RainConfig;
  private readonly message: string[];
  private readonly isStatic: boolean;
  private readonly glyphs: GlyphSource;
  private readonly random: RandomSource;
  private simulation: RainSimulation | null = null;
  private isDecoding = false;

  constructor(renderer: RainRenderer, options: BinaryRainOptions) {
    const config = resolveRainConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, maxStepMs: config.maxStepMs, scheduler: options.scheduler });

    this.renderer = renderer;
    this.config = config;
    this.message = options.message;
    this.isStatic = options.isStatic ?? false;
    this.glyphs = options.glyphs ?? new BinaryGlyphSource();
    this.random = options.random ?? Math.random;
  }

  // Pass a context created with { alpha: false }: the renderer fills the background itself, and an
  // opaque canvas spares the compositor a blend every frame.
  public static forCanvas(context: Canvas2DContext, options: BinaryRainOptions): BinaryRainEngine {
    return new BinaryRainEngine(new CanvasRainRenderer(context, options.config), options);
  }

  // Rebuilds the grid for the new size. If the message had already started to show it is put straight
  // back, because replaying the reveal on every resize or rotation would be noise.
  public resize(width: number, height: number, pixelRatio = 1): void {
    if (width <= 0 || height <= 0) {
      return;
    }

    const grid = createGrid(width, height, this.config);
    const wasRevealing = this.simulation?.isArmed ?? false;

    this.simulation = new RainSimulation(grid, this.message, { config: this.config, glyphs: this.glyphs, random: this.random });
    this.renderer.resize(grid, Math.min(pixelRatio, this.config.maxPixelRatio));

    if (this.isStatic || wasRevealing) {
      this.simulation.lockAll();
    } else if (this.isDecoding) {
      this.simulation.arm(performance.now());
    }

    this.render(performance.now());
  }

  // Assembles the message out of the rain. Runs once; later calls do nothing.
  public decode(): void {
    if (this.isDecoding) {
      return;
    }

    this.isDecoding = true;

    if (!this.simulation) {
      return;
    }

    if (this.isStatic) {
      this.simulation.lockAll();
      this.render(performance.now());

      return;
    }

    this.simulation.arm(performance.now());
  }

  protected canStart(): boolean {
    return !this.isStatic;
  }

  protected update(deltaMs: number, now: number): void {
    this.simulation?.step(deltaMs, now);
  }

  protected render(now: number): void {
    if (this.simulation) {
      this.renderer.draw(this.simulation.state, now);
    }
  }
}

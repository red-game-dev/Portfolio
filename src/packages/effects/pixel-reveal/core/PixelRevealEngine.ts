import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext, CanvasSize } from "@/packages/graphics/canvas";

import { PixelRevealConfig, PixelRevealConfigOverrides, resolvePixelRevealConfig } from "../config";
import { PixelRevealRenderer, PixelRevealStage } from "../domain/types";
import { CanvasPixelRevealRenderer, PixelRevealSource } from "../renderers/CanvasPixelRevealRenderer";
import { frameAt, totalDuration } from "../utils/timeline";

export interface PixelRevealOptions {
  config?: PixelRevealConfigOverrides;
  // Reduced motion: skip straight to the finished picture.
  isStatic?: boolean;
  scheduler?: FrameScheduler;
  // Called when the reveal moves into a new stage, a handful of times per play.
  onStageChange?: (stage: PixelRevealStage) => void;
  onDone?: () => void;
}

// Plays the reveal once on the shared frame loop. Before `play` it holds the first frame, the picture as
// binary, so the reveal has somewhere to start from even while it waits off screen.
export class PixelRevealEngine extends FrameLoop {
  private readonly renderer: PixelRevealRenderer;
  private readonly config: PixelRevealConfig;
  private readonly isStatic: boolean;
  private readonly onDone: () => void;
  private readonly onStageChange: (stage: PixelRevealStage) => void;
  private stage: PixelRevealStage | null = null;
  private elapsedMs = 0;
  private isPlaying = false;

  constructor(renderer: PixelRevealRenderer, options: PixelRevealOptions = {}) {
    const config = resolvePixelRevealConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, scheduler: options.scheduler });

    this.renderer = renderer;
    this.config = config;
    this.isStatic = options.isStatic ?? false;
    this.onDone = options.onDone ?? (() => undefined);
    this.onStageChange = options.onStageChange ?? (() => undefined);
  }

  public get isDone(): boolean {
    return this.elapsedMs >= totalDuration(this.config);
  }

  public static forCanvas(context: Canvas2DContext, source: PixelRevealSource, options: PixelRevealOptions = {}): PixelRevealEngine {
    return new PixelRevealEngine(new CanvasPixelRevealRenderer(context, source, resolvePixelRevealConfig(options.config)), options);
  }

  public resize(size: CanvasSize, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.renderer.resize(size, pixelRatio);
    this.render(0);
  }

  // Plays the reveal from the start. Calling it again while it plays, or after it finished, does nothing.
  public play(): void {
    if (this.isPlaying || this.isDone) {
      return;
    }

    if (this.isStatic) {
      this.elapsedMs = totalDuration(this.config);
      this.render(0);
      this.onDone();

      return;
    }

    this.isPlaying = true;
    this.start();
  }

  // Back to the binary frame, ready to play again, for when the picture leaves the screen and returns.
  // Static engines stay on the finished picture.
  public rewind(): void {
    if (this.isStatic) {
      return;
    }

    this.isPlaying = false;
    this.stop();
    this.elapsedMs = 0;
    this.render(0);
  }

  protected canStart(): boolean {
    return !this.isStatic;
  }

  protected update(deltaMs: number): void {
    if (this.isPlaying) {
      this.elapsedMs += deltaMs;
    }
  }

  protected render(now: number): void {
    const frame = frameAt(this.elapsedMs, this.config);

    this.renderer.draw(frame, now);

    if (frame.stage !== this.stage) {
      this.stage = frame.stage;
      this.onStageChange(frame.stage);
    }

    if (frame.stage === "done" && this.isPlaying) {
      this.isPlaying = false;
      this.stop();
      this.onDone();
    }
  }
}

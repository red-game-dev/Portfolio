import { FrameLoop, FrameScheduler, QualityGovernor } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { CanvasGlobeRenderer, GlobeRenderer, WebGLGlobeRenderer } from "@/packages/graphics/globe";
import { RandomSource } from "@/packages/math/random";

import { DEFAULT_LAUNCH_LABELS, DEFAULT_LAUNCH_THEME, LaunchConfig, LaunchConfigOverrides, LaunchLabels, LaunchTheme, resolveLaunchConfig } from "../config";
import { LaunchRenderer, LaunchSite, LaunchSize, LaunchSnapshot } from "../domain/types";
import { CanvasLaunchRenderer } from "../renderers/CanvasLaunchRenderer";
import { LaunchSimulation } from "./LaunchSimulation";

export interface LaunchOptions {
  config?: LaunchConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  // The pad it flies from, and the real moment of the launch, which sets the Sun over it.
  site?: LaunchSite;
  epochMs?: number;
  // Called when the status or the moments passed change, never once per frame.
  onChange?: (snapshot: LaunchSnapshot) => void;
}

export interface LaunchCanvasOptions extends LaunchOptions {
  // Only the colours that differ from the default theme, and the readout's labels.
  theme?: Partial<LaunchTheme>;
  labels?: LaunchLabels;
}

// Runs the launch on the shared frame loop and draws it. The loop runs only while something moves: it
// starts on a press and stops on the pad or in orbit, leaving the last frame on screen. A self destruct runs
// through its countdown and explosion and on into the next launch without stopping.
export class LaunchGame extends FrameLoop {
  private readonly renderer: LaunchRenderer;
  private readonly simulation: LaunchSimulation;
  private readonly onChange: (snapshot: LaunchSnapshot) => void;
  private lastSnapshot: LaunchSnapshot;
  // Steps the drawing down on a device whose frames run slow; the last level also draws at one pixel per pixel.
  private readonly governor = new QualityGovernor({ levels: 3 });
  private lastFrameAt = 0;
  private size: LaunchSize = { width: 0, height: 0 };
  private pixelRatio = 1;

  constructor(renderer: LaunchRenderer, options: LaunchOptions = {}) {
    const config: LaunchConfig = resolveLaunchConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, maxStepMs: config.maxStepMs, scheduler: options.scheduler });

    this.renderer = renderer;
    this.simulation = new LaunchSimulation({ width: 0, height: 0 }, { config, random: options.random ?? Math.random, site: options.site, epochMs: options.epochMs });
    this.onChange = options.onChange ?? (() => undefined);
    this.lastSnapshot = this.simulation.snapshot;
  }

  public get snapshot(): LaunchSnapshot {
    return this.lastSnapshot;
  }

  public static forCanvas(context: Canvas2DContext, options: LaunchCanvasOptions = {}): LaunchGame {
    // The Earth below is drawn by the GPU where there is one, from its real maps.
    const globes: GlobeRenderer = (typeof document !== "undefined" ? WebGLGlobeRenderer.create(document.createElement("canvas")) : null) ?? new CanvasGlobeRenderer();

    return new LaunchGame(new CanvasLaunchRenderer(context, { ...DEFAULT_LAUNCH_THEME, ...options.theme }, options.labels ?? DEFAULT_LAUNCH_LABELS, globes), options);
  }

  public resize(size: LaunchSize, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.size = size;
    this.pixelRatio = pixelRatio;
    this.simulation.resize(size);
    this.renderer.resize(size, this.sharpness());
    this.renderer.draw(this.simulation.state, 0);
  }

  // A real map for the Earth below; a still board is drawn again to show it.
  public setTexture(id: string, image: TexImageSource): void {
    this.renderer.setTexture?.(id, image);

    if (!this.isRunning) {
      this.renderer.draw(this.simulation.state, 0);
    }
  }

  // Stops for good and gives back what the renderer holds on the GPU.
  public dispose(): void {
    this.stop();
    this.renderer.dispose?.();
  }

  public press(): void {
    this.simulation.press();
    this.publishAndRun();
  }

  public release(): void {
    this.simulation.release();
  }

  public launch(): void {
    this.simulation.launch();
    this.publishAndRun();
  }

  public selfDestruct(): void {
    this.simulation.selfDestruct();
    this.publishAndRun();
  }

  // Straight to orbit with one still frame, for readers who prefer no motion.
  public complete(): void {
    this.simulation.complete();
    this.stop();
    this.renderer.draw(this.simulation.state, 0);
    this.publish();
  }

  public reset(): void {
    this.simulation.reset();
    this.stop();
    this.renderer.draw(this.simulation.state, 0);
    this.publish();
  }

  protected update(deltaMs: number): void {
    this.simulation.step(deltaMs);
    this.publish();
  }

  protected render(now: number): void {
    const { state } = this.simulation;
    const level = this.lastFrameAt > 0 ? this.governor.sample(now - this.lastFrameAt, now) : null;

    this.lastFrameAt = now;

    if (level !== null) {
      this.renderer.setQuality?.(level);
      this.renderer.resize(this.size, this.sharpness());
    }

    this.renderer.draw(state, now);

    if (state.status === "orbit" || state.status === "ready") {
      this.stop();
    }
  }

  // The pixel ratio to draw at: the device's, or one at the lowest quality.
  private sharpness(): number {
    return this.governor.level >= 2 ? 1 : this.pixelRatio;
  }

  private publishAndRun(): void {
    this.publish();
    this.lastFrameAt = 0;
    this.start();
  }

  private publish(): void {
    const next = this.simulation.snapshot;

    if (next.status !== this.lastSnapshot.status || next.passed !== this.lastSnapshot.passed || next.countdown !== this.lastSnapshot.countdown) {
      this.lastSnapshot = next;
      this.onChange(next);
    }
  }
}

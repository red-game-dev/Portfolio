import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { BugRaidConfig, BugRaidConfigOverrides, BugRaidTheme, resolveBugRaidConfig } from "../config";
import { BugRaidRenderer, BugRaidSize, BugRaidSnapshot } from "../domain/types";
import { CanvasBugRaidRenderer } from "../renderers/CanvasBugRaidRenderer";
import { BugRaidSimulation } from "./BugRaidSimulation";

export interface BugRaidOptions {
  config?: BugRaidConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  // Called when the score, lives, wave or status change, never once per frame.
  onChange?: (snapshot: BugRaidSnapshot) => void;
}

export interface BugRaidCanvasOptions extends BugRaidOptions {
  theme?: BugRaidTheme;
  productionLabel?: string;
}

const isSameSnapshot = (a: BugRaidSnapshot, b: BugRaidSnapshot) => a.status === b.status && a.score === b.score && a.lives === b.lives &&
  a.wave === b.wave;

// Runs the simulation on the shared frame loop, draws it, and tells the UI when something it shows has
// changed. Input is forwarded as game coordinates, so the same game takes a mouse, a finger or keys.
export class BugRaidGame extends FrameLoop {
  private readonly renderer: BugRaidRenderer;
  private readonly simulation: BugRaidSimulation;
  private readonly onChange: (snapshot: BugRaidSnapshot) => void;
  private lastSnapshot: BugRaidSnapshot;

  constructor(renderer: BugRaidRenderer, options: BugRaidOptions = {}) {
    const config: BugRaidConfig = resolveBugRaidConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, maxStepMs: config.maxStepMs, scheduler: options.scheduler });

    this.renderer = renderer;
    this.simulation = new BugRaidSimulation({ width: 0, height: 0 }, { config, random: options.random ?? Math.random });
    this.onChange = options.onChange ?? (() => undefined);
    this.lastSnapshot = this.simulation.snapshot;
  }

  public get snapshot(): BugRaidSnapshot {
    return this.lastSnapshot;
  }

  public static forCanvas(context: Canvas2DContext, options: BugRaidCanvasOptions = {}): BugRaidGame {
    const renderer = new CanvasBugRaidRenderer(context, resolveBugRaidConfig(options.config), options.theme, options.productionLabel);

    return new BugRaidGame(renderer, options);
  }

  public resize(size: BugRaidSize, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.simulation.resize(size);
    this.renderer.resize(size, pixelRatio);
    this.renderer.draw(this.simulation.state, 0);
  }

  // Starts a new game from scratch, whatever state the last one ended in.
  public play(): void {
    this.simulation.start();
    this.publish();
    this.start();
  }

  // Stops the clock without ending the game; `resume` carries on from the same moment.
  public pause(): void {
    this.stop();
  }

  public resume(): void {
    if (this.simulation.state.status === "playing") {
      this.start();
    }
  }

  public strike(x: number, y: number): boolean {
    return this.isRunning && this.simulation.strike(x, y);
  }

  public aim(stepsX: number, stepsY: number): void {
    if (this.isRunning) {
      this.simulation.aim(stepsX, stepsY);
    }
  }

  public strikeAtCursor(): boolean {
    return this.isRunning && this.simulation.strikeAtCursor();
  }

  protected update(deltaMs: number): void {
    this.simulation.step(deltaMs);
    this.publish();

    if (this.simulation.state.status === "over") {
      this.stop();
    }
  }

  protected render(now: number): void {
    this.renderer.draw(this.simulation.state, now);
  }

  private publish(): void {
    const next = this.simulation.snapshot;

    if (!isSameSnapshot(next, this.lastSnapshot)) {
      this.lastSnapshot = next;
      this.onChange(next);
    }
  }
}

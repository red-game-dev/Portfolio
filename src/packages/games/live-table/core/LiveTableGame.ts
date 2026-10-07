import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { DEFAULT_LIVE_TABLE_THEME, LiveTableConfig, LiveTableConfigOverrides, LiveTableTheme, resolveLiveTableConfig } from "../config";
import { LiveTableEvent, LiveTablePlayResult, LiveTableRenderer, LiveTableSize, LiveTableSnapshot } from "../domain/types";
import { CanvasLiveTableRenderer } from "../renderers/CanvasLiveTableRenderer";
import { LiveTableSimulation } from "./LiveTableSimulation";

export interface LiveTableOptions {
  config?: LiveTableConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  // Called when the phase, the hands or the table change, never once per frame.
  onChange?: (snapshot: LiveTableSnapshot) => void;
  onEvent?: (event: LiveTableEvent) => void;
}

export interface LiveTableCanvasOptions extends LiveTableOptions {
  theme?: LiveTableTheme;
}

// Runs the table on the shared frame loop and draws it. The page plays cards through play(), which
// answers whether the dealer took the bet, and hears about every change through onChange.
export class LiveTableGame extends FrameLoop {
  private readonly renderer: LiveTableRenderer;
  private readonly simulation: LiveTableSimulation;
  private readonly onChange: (snapshot: LiveTableSnapshot) => void;
  private readonly onEvent: (event: LiveTableEvent) => void;

  constructor(renderer: LiveTableRenderer, cards: string[], options: LiveTableOptions = {}) {
    const config: LiveTableConfig = resolveLiveTableConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, maxStepMs: config.maxStepMs, scheduler: options.scheduler });

    this.renderer = renderer;
    this.simulation = new LiveTableSimulation(cards, { config, random: options.random ?? Math.random });
    this.onChange = options.onChange ?? (() => undefined);
    this.onEvent = options.onEvent ?? (() => undefined);
  }

  public get snapshot(): LiveTableSnapshot {
    return this.simulation.snapshot;
  }

  public static forCanvas(context: Canvas2DContext, cards: string[], options: LiveTableCanvasOptions = {}): LiveTableGame {
    const config = resolveLiveTableConfig(options.config);

    return new LiveTableGame(new CanvasLiveTableRenderer(context, config, options.theme ?? DEFAULT_LIVE_TABLE_THEME), cards, options);
  }

  public resize(size: LiveTableSize, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.renderer.resize(size, pixelRatio);
    this.render(0);
  }

  public play(card: string): LiveTablePlayResult {
    const result = this.simulation.play(card);

    if (result.accepted) {
      this.onChange(this.simulation.snapshot);
    }

    return result;
  }

  public redeal(): void {
    this.simulation.redeal();
    this.onChange(this.simulation.snapshot);
  }

  protected update(deltaMs: number): void {
    const events = this.simulation.step(deltaMs);

    events.forEach((event) => this.onEvent(event));

    if (events.length > 0) {
      this.onChange(this.simulation.snapshot);
    }
  }

  protected render(now: number): void {
    this.renderer.draw(this.simulation.scene, now);
  }
}

import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { DEFAULT_VOYAGE_THEME, resolveVoyageConfig, VoyageConfig, VoyageConfigOverrides, VoyageTheme } from "../config";
import { VoyageInput, VoyageRenderer, VoyageSize, VoyageSnapshot } from "../domain/types";
import { CanvasVoyageRenderer } from "../renderers/CanvasVoyageRenderer";
import { VoyageSimulation } from "./VoyageSimulation";

export interface VoyageOptions {
  config?: VoyageConfigOverrides;
  random?: RandomSource;
  scheduler?: FrameScheduler;
  // Called when something a UI shows changes: at once for the status, phase, universe, shields and the stop
  // passed, and at most every `tickMs` for the score and the distance, never once per frame.
  onChange?: (snapshot: VoyageSnapshot) => void;
}

export interface VoyageCanvasOptions extends VoyageOptions {
  // Only the colours that differ from the default theme. Its universes set how many there are.
  theme?: Partial<VoyageTheme>;
}

// The score and distance tick over this often for the UI.
const TICK_MS = 250;
// After the ship is lost, the loop runs this long more for the wreck to finish, then stops on its last frame.
const WRECK_MS = 1800;

const isSameMoment = (a: VoyageSnapshot, b: VoyageSnapshot) => a.status === b.status && a.phase === b.phase && a.universe === b.universe &&
  a.universes === b.universes && a.shields === b.shields && a.passing === b.passing;

// Runs the voyage on the shared frame loop, draws it, and takes steering from keys, a pointer or a finger,
// forwarded in world units so the same game plays on any screen.
export class VoyageGame extends FrameLoop {
  private readonly renderer: VoyageRenderer;
  private readonly simulation: VoyageSimulation;
  private readonly onChange: (snapshot: VoyageSnapshot) => void;
  private readonly input: VoyageInput = { direction: { x: 0, y: 0 }, target: null };
  private lastSnapshot: VoyageSnapshot;
  private lastTickAt = 0;

  constructor(renderer: VoyageRenderer, options: VoyageOptions = {}) {
    const config: VoyageConfig = resolveVoyageConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, maxStepMs: config.maxStepMs, scheduler: options.scheduler });

    this.renderer = renderer;
    this.simulation = new VoyageSimulation({ width: 0, height: 0 }, { config, random: options.random ?? Math.random });
    this.onChange = options.onChange ?? (() => undefined);
    this.lastSnapshot = this.simulation.snapshot;
  }

  public get snapshot(): VoyageSnapshot {
    return this.lastSnapshot;
  }

  public static forCanvas(context: Canvas2DContext, options: VoyageCanvasOptions = {}): VoyageGame {
    const theme = { ...DEFAULT_VOYAGE_THEME, ...options.theme };

    return new VoyageGame(new CanvasVoyageRenderer(context, theme), { ...options, config: { universes: theme.universes.length, ...options.config } });
  }

  public resize(size: VoyageSize, pixelRatio = 1): void {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    this.simulation.resize(size);
    this.renderer.resize(size, pixelRatio);
    this.renderer.draw(this.simulation.state, performance.now());
  }

  // A new run from Earth.
  public play(): void {
    this.simulation.start();
    this.input.target = null;
    this.publish(true);
    this.start();
  }

  public pause(): void {
    this.stop();
  }

  public resume(): void {
    if (this.simulation.state.status === "flying") {
      this.start();
    }
  }

  // From keys: -1 to 1 on each axis, 0 to let go.
  public steer(x: number, y: number): void {
    this.input.direction = { x, y };
  }

  // From a pointer or a finger, in pixels on the canvas: the ship flies towards it.
  public pointTo(x: number, y: number): void {
    const { unit } = this.simulation.state;

    this.input.target = { x: x / unit, y: y / unit };
  }

  public release(): void {
    this.input.target = null;
  }

  protected update(deltaMs: number, now: number): void {
    this.simulation.step(deltaMs, this.input);
    this.publish(false, now);
  }

  protected render(now: number): void {
    const { state } = this.simulation;

    this.renderer.draw(state, now);

    if (state.status === "over" && state.phaseMs > WRECK_MS) {
      this.stop();
    }
  }

  private publish(force: boolean, now = 0): void {
    const next = this.simulation.snapshot;
    const isMoment = !isSameMoment(next, this.lastSnapshot);
    const isTick = now - this.lastTickAt >= TICK_MS && (next.score !== this.lastSnapshot.score || next.au !== this.lastSnapshot.au);

    if (force || isMoment || isTick) {
      this.lastSnapshot = next;
      this.lastTickAt = now;
      this.onChange(next);
    }
  }
}

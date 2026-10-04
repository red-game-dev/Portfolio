import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { BackdropConfig, BackdropConfigOverrides, resolveBackdropConfig } from "../config";
import { Scene, SceneFactory, SceneSize } from "../domain/types";
import { easeInOut } from "../utils/easing";
import { SceneCompositor } from "./SceneCompositor";

export interface BackdropOptions {
  scenes: SceneFactory[];
  initialScene: string;
  config?: BackdropConfigOverrides;
  // Reduced motion: draw a still frame of the current scene and never start the loop.
  isStatic?: boolean;
  random?: RandomSource;
  scheduler?: FrameScheduler;
}

// A full screen backdrop that moves between scenes as the reader moves through the page. Only the
// current scene and, during a fade, the previous one are updated and drawn.
export class BackdropEngine extends FrameLoop {
  private readonly compositor: SceneCompositor;
  private readonly config: BackdropConfig;
  private readonly scenes = new Map<string, Scene>();
  private readonly isStatic: boolean;
  private current: Scene;
  private previous: Scene | null = null;
  private fadeStartedAt = 0;

  constructor(context: Canvas2DContext, options: BackdropOptions) {
    const config = resolveBackdropConfig(options.config);

    super({ framesPerSecond: config.framesPerSecond, scheduler: options.scheduler });

    const random = options.random ?? Math.random;

    this.config = config;
    this.compositor = new SceneCompositor(context, config.background);
    this.isStatic = options.isStatic ?? false;
    options.scenes.forEach((factory) => {
      const scene = factory(random);

      this.scenes.set(scene.id, scene);
    });

    const initial = this.scenes.get(options.initialScene);

    if (!initial) {
      throw new Error(`BackdropEngine has no scene "${options.initialScene}"`);
    }

    this.current = initial;
  }

  public resize(width: number, height: number, pixelRatio = 1): void {
    if (width <= 0 || height <= 0) {
      return;
    }

    const size: SceneSize = { width, height, pixelRatio: Math.min(pixelRatio, this.config.maxPixelRatio) };

    this.compositor.resizeSurface(width, height, size.pixelRatio);
    this.scenes.forEach((scene) => scene.resize(size));
    this.render(performance.now());
  }

  // Starts a crossfade to the scene with this id. Unknown ids and the current scene are ignored.
  public setScene(id: string): void {
    const next = this.scenes.get(id);

    if (!next || next === this.current) {
      return;
    }

    this.previous = this.current;
    this.current = next;
    this.fadeStartedAt = performance.now();

    if (this.isStatic) {
      this.previous = null;
      this.render(this.fadeStartedAt);
    }
  }

  protected canStart(): boolean {
    return !this.isStatic;
  }

  protected update(deltaMs: number, now: number): void {
    this.current.update(deltaMs, now);
    this.previous?.update(deltaMs, now);

    if (this.previous && now - this.fadeStartedAt >= this.config.fadeMs) {
      this.previous = null;
    }
  }

  protected render(now: number): void {
    const progress = this.previous ? easeInOut((now - this.fadeStartedAt) / this.config.fadeMs) : 1;
    const layers = this.previous
      ? [{ scene: this.previous, alpha: 1 - progress }, { scene: this.current, alpha: progress }]
      : [{ scene: this.current, alpha: 1 }];

    this.compositor.draw({ layers }, now);
  }
}

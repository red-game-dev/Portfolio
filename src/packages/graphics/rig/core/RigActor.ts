import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { RigModel, RigSkin } from "../domain/types";
import { Animator } from "./Animator";
import { RigRenderer } from "./RigRenderer";

export interface RigActorOptions<TSkin extends RigSkin> {
  model: RigModel<TSkin>;
  skins: TSkin[];
  // Extra cues for this actor, on top of the model's own idle life.
  setup?: (animator: Animator) => void;
  framesPerSecond?: number;
  scheduler?: FrameScheduler;
  random?: RandomSource;
  renderer?: RigRenderer<TSkin>;
}

// One character on one canvas: a model, the skins it can wear, an animator for its cues, and the shared
// frame loop. The page sizes it, picks a skin and plays cues; the actor does the rest.
export class RigActor<TSkin extends RigSkin> extends FrameLoop {
  private readonly context: Canvas2DContext;
  private readonly model: RigModel<TSkin>;
  private readonly skins: TSkin[];
  private readonly animator: Animator;
  private readonly renderer: RigRenderer<TSkin>;
  private skinIndex = 0;
  private width = 0;

  constructor(context: Canvas2DContext, { model, skins, setup, framesPerSecond = 30, scheduler, random, renderer }: RigActorOptions<TSkin>) {
    super({ framesPerSecond, scheduler });
    this.context = context;
    this.model = model;
    this.skins = skins;
    this.animator = new Animator(random);
    this.renderer = renderer ?? new RigRenderer(model);
    model.setup?.(this.animator);
    setup?.(this.animator);
  }

  public get skinCount(): number {
    return this.skins.length;
  }

  public get skin(): number {
    return this.skinIndex;
  }

  // Sized by width; the height follows the model's own proportions.
  public resize(width: number, pixelRatio = 1): void {
    if (width <= 0) {
      return;
    }

    const scale = (width / this.model.width) * pixelRatio;

    this.width = width;
    this.context.canvas.width = Math.ceil(this.model.width * scale);
    this.context.canvas.height = Math.ceil(this.model.height * scale);
    this.renderer.rescale(scale);
    this.render();
  }

  public setSkin(index: number): void {
    this.skinIndex = ((index % this.skins.length) + this.skins.length) % this.skins.length;
    this.render();
  }

  public setSkinById(id: string): void {
    const index = this.skins.findIndex((skin) => skin.id === id);

    if (index >= 0) {
      this.setSkin(index);
    }
  }

  public play(cue: string, durationMs: number): void {
    this.animator.play(cue, durationMs);
  }

  // A still frame, for reduced motion or before the loop starts.
  public renderStill(): void {
    this.render();
  }

  protected update(deltaMs: number): void {
    this.animator.advance(deltaMs);
  }

  protected render(): void {
    if (this.width === 0) {
      return;
    }

    const { context } = this;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    this.renderer.draw(context, this.skins[this.skinIndex], this.model.channels(this.animator.timeMs, this.animator));
  }
}

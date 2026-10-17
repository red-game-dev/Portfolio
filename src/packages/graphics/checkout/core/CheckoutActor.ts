import { QualityGovernor } from "@/packages/animation/frame-loop";
import { RigActor, RigActorOptions, RigModel } from "@/packages/graphics/rig";

import { CheckoutSkin, CheckoutStage } from "../domain/types";

// The finest quality a stage draws at; the governor counts down from it.
const FINEST = 3;

// The checkout's actor: drawn flat from the start, so the counter is there at once, and taking up a 3D stage's model
// once that is ready (between payments, never in the middle of one). Its frames tell the stage's quality when to step
// down; a stage that loses its GPU hands the counter back to the flat drawing; and retired, it gives the stage's scene
// back.
export class CheckoutActor extends RigActor<CheckoutSkin> {
  private readonly flat: RigModel<CheckoutSkin>;
  private stage: CheckoutStage | null = null;
  private waiting: { stage: CheckoutStage; model: RigModel<CheckoutSkin> } | null = null;
  private governor: QualityGovernor | null = null;
  private forgetLoss: (() => void) | null = null;
  private isRetired = false;

  constructor(context: CanvasRenderingContext2D, options: RigActorOptions<CheckoutSkin>) {
    super(context, options);
    this.flat = options.model;
  }

  public get hasStage(): boolean {
    return this.stage !== null;
  }

  // Takes up a stage's model: at once while still, otherwise as soon as the payment playing ends.
  public upgrade(stage: CheckoutStage, model: RigModel<CheckoutSkin>): void {
    if (this.isRetired) {
      stage.release();

      return;
    }

    if (this.isRunning) {
      this.waiting?.stage.release();
      this.waiting = { stage, model };

      return;
    }

    this.adopt(stage, model);
  }

  public stop(): void {
    super.stop();

    if (this.waiting && !this.isRetired) {
      const { stage, model } = this.waiting;

      this.waiting = null;
      this.adopt(stage, model);
    }
  }

  public dispose(): void {
    this.isRetired = true;
    this.stop();
    this.forgetLoss?.();
    this.stage?.release();
    this.waiting?.stage.release();
    this.stage = null;
    this.waiting = null;
  }

  protected update(deltaMs: number, now = 0): void {
    super.update(deltaMs);

    const level = this.governor?.sample(deltaMs, now);

    if (level !== null && level !== undefined) {
      this.stage?.setQuality(FINEST - level);
    }
  }

  private adopt(stage: CheckoutStage, model: RigModel<CheckoutSkin>): void {
    this.stage = stage;
    this.governor = new QualityGovernor({ levels: FINEST + 1, start: FINEST - stage.quality() });
    this.forgetLoss = stage.onLost(() => this.downgrade());
    this.replaceModel(model);
  }

  private downgrade(): void {
    this.forgetLoss?.();
    this.forgetLoss = null;
    this.stage = null;
    this.governor = null;
    this.replaceModel(this.flat);
  }
}

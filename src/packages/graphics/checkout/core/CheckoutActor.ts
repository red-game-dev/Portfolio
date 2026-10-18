import { QualityGovernor } from "@/packages/animation/frame-loop";
import { RigActor, RigActorOptions, RigModel } from "@/packages/graphics/rig";

import { CheckoutAmount, CheckoutSkin, CheckoutStage, CheckoutVariant } from "../domain/types";
import { createCheckoutModel } from "./checkoutModel";

// The finest quality a stage draws at; the governor counts down from it.
const FINEST = 3;

// The checkout's actor: drawn flat from the start, so the counter is there at once, and taking up a 3D stage's model
// once that is ready (between payments, never in the middle of one). Each payment can ring up a new total, told to its
// models in place (the stage kept). Its frames tell the stage's quality when to step down; a stage that loses its GPU
// hands the counter back to the flat drawing; and retired, it gives the stage's scene back.
export class CheckoutActor extends RigActor<CheckoutSkin> {
  private readonly dressed: CheckoutSkin | undefined;
  private flat: RigModel<CheckoutSkin>;
  private stage: CheckoutStage | null = null;
  private waiting: { stage: CheckoutStage; model: RigModel<CheckoutSkin> } | null = null;
  private governor: QualityGovernor | null = null;
  private forgetLoss: (() => void) | null = null;
  private isRetired = false;

  constructor(context: CanvasRenderingContext2D, options: RigActorOptions<CheckoutSkin>) {
    super(context, options);
    this.flat = options.model;
    this.dressed = options.skins[0];
  }

  public get hasStage(): boolean {
    return this.stage !== null;
  }

  // Given back: it never runs or takes a total again (a counter rebuilt for another way to pay replaces it).
  public get isGone(): boolean {
    return this.isRetired;
  }

  // Rings up a new total: the drawing, and the stage's where it has one or one is waiting, told the amount, so the
  // cashier keys it and the screen shows it.
  public rebill(amount: CheckoutAmount, variant: CheckoutVariant): void {
    if (!this.dressed || this.isRetired) {
      return;
    }

    const skin = { ...this.dressed, amount };

    this.flat = createCheckoutModel(skin, variant);

    if (this.waiting) {
      this.waiting = { ...this.waiting, model: createCheckoutModel(skin, variant, this.waiting.stage) };
    }

    // The same counter told a new total: its cached frames (the counter, the stand, the terminal) still hold.
    this.replaceModel(this.stage ? createCheckoutModel(skin, variant, this.stage) : this.flat, true);
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

  protected canStart(): boolean {
    return !this.isRetired && super.canStart();
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

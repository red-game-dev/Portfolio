import { RigActor, RigActorOptions } from "@/packages/graphics/rig";

import { CheckoutSkin } from "../domain/types";
import { CheckoutStage } from "./checkoutStage";

// The checkout's actor: the rig's, which also gives its 3D scene back to the stage when it is retired.
export class CheckoutActor extends RigActor<CheckoutSkin> {
  private readonly stage: CheckoutStage | null;

  constructor(context: CanvasRenderingContext2D, options: RigActorOptions<CheckoutSkin>, stage: CheckoutStage | null = null) {
    super(context, options);
    this.stage = stage;
  }

  public dispose(): void {
    this.stop();
    this.stage?.release();
  }
}

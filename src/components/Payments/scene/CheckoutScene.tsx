import { FC, useEffect, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { PAYMENT_LOOKS } from "@/components/Payments/scene/looks";
import { markOf } from "@/components/Payments/scene/marks";
import { PAY_APPS, PAY_GESTURES, payAppOf, PayGesture, PaymentMethodId } from "@/config/payments";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import type { CheckoutActor, CheckoutSkin, CheckoutVariant } from "@/packages/graphics/checkout";

export type CheckoutMode = "idle" | "playing" | "approved";

interface CheckoutSceneProps {
  method: PaymentMethodId;
  variant: CheckoutVariant;
  // Waiting for a payment, telling one, or showing one approved without moving (with less motion asked for).
  mode: CheckoutMode;
  durationMs: number;
  // The total the screen shows; a switch, which carries no words, passes none and the screen shows a bar.
  amount: string;
  accent: string;
  // How the method meets the terminal, where a story asks for another way than its own (the POS taps every card).
  gesture?: PayGesture;
  // Who the counter's cards are issued to, and the picture the red card prints; a switch shows them plain.
  cardholder?: { name: string; portrait: string };
}

// Drawn at the scene's own proportions, as wide as it is given.
const Box = styled.div(() => [
  tw`relative w-full`,
  css`
    aspect-ratio: 300 / 210;
  `,
]);

const Canvas = tw.canvas`block w-full h-full`;

// The checkout on canvas: the terminal and its screen drawn by the rig engine, the hands and what the customer holds
// drawn in 3D on the page's stage (or flat where there is none), the code loaded only once the scene is near. A
// payment plays once and the scene rests after it; nothing runs while it waits.
export const CheckoutScene: FC<CheckoutSceneProps> = ({ method, variant, mode, durationMs, amount, accent, gesture, cardholder }: CheckoutSceneProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skin = useMemo<CheckoutSkin>(() => {
    const design = PAYMENT_LOOKS[method].card;

    return {
      id: `${method}-${gesture ?? "own"}${cardholder ? "-issued" : ""}`,
      look: {
        gesture: gesture ?? PAY_GESTURES[method],
        app: PAY_APPS.indexOf(payAppOf(method)),
        face: PAYMENT_LOOKS[method].face,
        mark: markOf(method, design?.ink),
        card: design ? { ...design, holder: cardholder?.name ?? "" } : undefined,
      },
      amount,
      accent,
    };
  }, [method, gesture, amount, accent, cardholder]);
  const portrait = skin.look.card?.issuer === "portrait" ? cardholder?.portrait : undefined;
  const actor = useCanvasEngine<CheckoutActor>(canvasRef, {
    sizeRef: boxRef,
    nearMargin: "100% 0px",
    create: async (context) => {
      const [checkout, { stageReady }, { decodeImage }] = await Promise.all([
        import("@/packages/graphics/checkout"),
        import("@/services/stage"),
        import("@/packages/browser/images"),
      ]);
      const picture = portrait ? await decodeImage(portrait).catch(() => null) : null;
      const dressed: CheckoutSkin = picture ? { ...skin, look: { ...skin.look, portrait: picture } } : skin;
      const stage = await stageReady().catch(() => null);
      const bound = stage ? await checkout.bindCheckoutStage(stage, dressed).catch(() => null) : null;

      return new checkout.CheckoutActor(context, { model: checkout.createCheckoutModel(dressed, variant, bound), skins: [dressed], framesPerSecond: 60 }, bound);
    },
    resize: (engine, { width, pixelRatio }) => engine.resize(width, pixelRatio),
  }, [skin, variant, portrait]);

  useEffect(() => {
    if (!actor) {
      return undefined;
    }

    if (mode === "approved") {
      actor.play("approved", Number.MAX_SAFE_INTEGER);
      actor.renderStill();

      return undefined;
    }

    if (mode === "idle") {
      actor.stop();
      actor.renderStill();

      return undefined;
    }

    actor.play("pay", durationMs);
    actor.start();

    // Rests once the payment has played, drawn as it ends.
    const rest = window.setTimeout(() => {
      actor.stop();
      actor.renderStill();
    }, durationMs + 60);

    return () => window.clearTimeout(rest);
  }, [actor, mode, durationMs]);

  return (
    <Box ref={boxRef} aria-hidden="true">
      <Canvas ref={canvasRef} />
    </Box>
  );
};

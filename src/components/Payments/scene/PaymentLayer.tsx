import { FC, useLayoutEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { styled } from "twin.macro";

import { NO_AMOUNT } from "@/components/Payments/config";
import { CheckoutScene } from "@/components/Payments/scene/CheckoutScene";
import { StoryCanvas } from "@/components/Payments/scene/StoryCanvas";
import { PAYMENT_SWITCH_MS, PaymentEffect } from "@/components/SwitchStage/config";
import { CARD_METHODS, methodForSwitch, PAY_SEQUENCE } from "@/config/payments";
import { THEME_ACCENTS } from "@/config/sectionThemes";
import { CHECKOUT_SCENE as COUNTER } from "@/packages/graphics/checkout";
import { noAnimationWhenReduced } from "@/styles/mixins";

// Scaled by --fit where the drawing is narrower than the counter, so nobody at it is cut off.
const panelIn = keyframes`
  0% { opacity: 0; transform: translateX(-50%) scale(calc(var(--fit) * 0.96)); }
  8% { opacity: 1; transform: translateX(-50%) scale(var(--fit)); }
  84% { opacity: 1; transform: translateX(-50%) scale(var(--fit)); }
  100% { opacity: 0; transform: translateX(-50%) scale(calc(var(--fit) * 0.98)); }
`;

// The room either side of the panel inside the drawing.
const PANEL_GUTTER = 16;

// Over the top of the new content, where it is on screen as the switch begins, and never in the way of a press.
const Panel = styled.div`
  ${tw`absolute z-[3] left-1/2 top-[24px] pointer-events-none rounded-[8px] overflow-hidden bg-[rgba(10,10,10,0.92)]
  border-[1px] border-solid border-[var(--accent-muted)]`}

  width: ${COUNTER.width}px;
  height: ${COUNTER.height}px;
  box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.18);
  transform-origin: top center;
  transform: translateX(-50%) scale(var(--fit));
  animation: ${panelIn} var(--pay-ms) ease-out both;

  ${noAnimationWhenReduced}
`;

// A payments drawing's switch: its subject as a showcase opens it, or the next way to pay at the counter
// between its own tabs. `count` is the switch's number, so each one pays with the next method in turn.
export const PaymentLayer: FC<{ effect: PaymentEffect; count: number }> = ({ effect, count }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  // Read once as the switch begins: the drawing's width, never on scroll.
  useLayoutEffect(() => {
    const room = panelRef.current?.parentElement?.clientWidth;

    if (room) {
      setFit(Math.min(1, (room - PANEL_GUTTER) / COUNTER.width));
    }
  }, []);

  const style = { "--pay-ms": `${PAYMENT_SWITCH_MS}ms`, "--fit": fit };

  if (effect === "pay" || effect === "tap") {
    const method = effect === "pay" ? methodForSwitch(PAY_SEQUENCE, count) : methodForSwitch(CARD_METHODS, count);

    return (
      <Panel ref={panelRef} data-switch-fx aria-hidden="true" style={style}>
        <CheckoutScene
          method={method}
          variant="quick"
          mode="playing"
          gesture={effect === "tap" ? "tap" : undefined}
          durationMs={PAYMENT_SWITCH_MS}
          amount={NO_AMOUNT}
          accent={THEME_ACCENTS.payments}
        />
      </Panel>
    );
  }

  return (
    <Panel ref={panelRef} data-switch-fx aria-hidden="true" style={style}>
      <StoryCanvas story={effect} />
    </Panel>
  );
};

import { CSSProperties, FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { Counter, COUNTER } from "@/components/Payments/scene/Counter";
import { STORIES } from "@/components/Payments/scene/Stories";
import { PAYMENT_SWITCH_MS, PaymentEffect } from "@/components/SwitchStage/config";
import { CARD_METHODS, methodForSwitch, PAY_SEQUENCE } from "@/config/payments";
import { noAnimationWhenReduced } from "@/styles/mixins";

const panelIn = keyframes`
  0% { opacity: 0; transform: translateX(-50%) scale(0.96); }
  8% { opacity: 1; transform: translateX(-50%) scale(1); }
  84% { opacity: 1; transform: translateX(-50%) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) scale(0.98); }
`;

// Over the top of the new content, where it is on screen as the switch begins, and never in the way of a press.
const Panel = styled.div(() => [
  tw`absolute z-[3] left-1/2 top-[24px] pointer-events-none rounded-[8px] overflow-hidden bg-[rgba(10,10,10,0.92)]
  border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    width: ${COUNTER.width}px;
    height: ${COUNTER.height}px;
    max-width: calc(100% - 16px);
    box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.18);
    transform: translateX(-50%);
    animation: ${panelIn} var(--pay-ms) ease-out both;
  `,
  noAnimationWhenReduced,
]);

// A payments drawing's switch: its subject as a showcase opens it, or the next way to pay at the counter
// between its own tabs. `count` is the switch's number, so each one pays with the next method in turn.
export const PaymentLayer: FC<{ effect: PaymentEffect; count: number }> = ({ effect, count }) => {
  const style = { "--pay-ms": `${PAYMENT_SWITCH_MS}ms` } as CSSProperties;

  if (effect === "pay" || effect === "tap") {
    const method = effect === "pay" ? methodForSwitch(PAY_SEQUENCE, count) : methodForSwitch(CARD_METHODS, count);

    return (
      <Panel data-switch-fx aria-hidden="true" style={style}>
        <Counter
          method={method}
          variant="quick"
          mode="playing"
          gesture={effect === "tap" ? "tap" : undefined}
          durationMs={PAYMENT_SWITCH_MS}
        />
      </Panel>
    );
  }

  const Story = STORIES[effect];

  return (
    <Panel data-switch-fx aria-hidden="true" style={style}>
      <Story />
    </Panel>
  );
};

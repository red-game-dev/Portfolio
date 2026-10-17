import { CSSProperties, FC, useCallback, useEffect, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { approvedMsOf, payMsOf, RESET_MS, TERMINAL_SCALE } from "@/components/Payments/config";
import { CheckoutScene } from "@/components/Payments/scene/CheckoutScene";
import { PAYMENT_LOOKS } from "@/components/Payments/scene/looks";
import { Mark } from "@/components/Payments/scene/Mark";
import { PAY_APPS, PAY_GESTURES, payAppOf, PAYMENT_GROUP_ORDER, PAYMENT_GROUPS, PaymentMethodId } from "@/config/payments";
import { THEME_ACCENTS } from "@/config/sectionThemes";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CHECKOUT_SCENE } from "@/packages/graphics/checkout";
import { fill } from "@/packages/text/format";
import { focusRing, media } from "@/styles/mixins";
import { PaymentTerminalContent } from "@/types/payments";

interface PayTerminalProps {
  content: PaymentTerminalContent;
  // A payment went through: the section opens its next drawing.
  onPaid: () => void;
}

type Phase =
  | { kind: "idle" }
  | { kind: "paying" | "approved"; method: PaymentMethodId; press: number };

const Wrap = styled.div(() => [
  tw`flex flex-col items-center gap-[18px] p-[18px] md:p-[24px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    ${media.xl} {
      flex-direction: row;
      align-items: center;
      gap: 32px;
    }
  `,
]);

const SceneBox = styled.div(() => [
  tw`relative flex-shrink-0`,
  css`
    --scale: ${TERMINAL_SCALE.narrow};
    width: calc(${CHECKOUT_SCENE.width}px * var(--scale));
    height: calc(${CHECKOUT_SCENE.height}px * var(--scale));

    @media (max-width: 389px) {
      --scale: ${TERMINAL_SCALE.narrower};
    }

    @media (max-width: 349px) {
      --scale: ${TERMINAL_SCALE.narrowest};
    }

    ${media.xl} {
      --scale: ${TERMINAL_SCALE.wide};
    }

    & > * {
      transform: scale(var(--scale));
      transform-origin: top left;
    }
  `,
]);

const Side = tw.div`flex flex-col gap-[12px] w-full`;

const Hint = tw.p`m-0 text-sm text-[#bbb]`;

const Groups = tw.div`flex flex-col gap-[10px]`;

const Group = tw.div`flex flex-col gap-[6px]`;

const GroupName = tw.span`text-xs font-semibold text-[#8a8a8a]`;

const Methods = tw.div`flex flex-row flex-wrap gap-[8px]`;

const MethodButton = styled.button(() => [
  tw`relative flex items-center justify-center w-[58px] h-[38px] p-0 cursor-pointer rounded-[5px] border-[1px] border-solid
  border-[rgba(255,255,255,0.16)]`,
  css`
    background: linear-gradient(135deg, var(--face-from), var(--face-to));
    transition: transform 0.15s ease, border-color 0.15s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }

    &[data-current] {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent);
    }

    &[aria-disabled="true"] {
      cursor: progress;
    }

    ${media.reducedMotion} {
      transition: none;

      &:hover {
        transform: none;
      }
    }
  `,
  focusRing("var(--accent)", 3),
]);

// Two lines held, so the line wrapping on a phone never moves the drawings below.
const Status = tw.p`m-0 min-h-[2.5rem] text-sm text-[var(--accent)]`;

const clearAll = (pending: number[]) => {
  pending.splice(0).forEach((timer) => window.clearTimeout(timer));
};

const faceOf = (method: PaymentMethodId) =>
  ({ "--face-from": PAYMENT_LOOKS[method].face[0], "--face-to": PAYMENT_LOOKS[method].face[1] }) as CSSProperties;

// A card terminal the reader pays at: every way to pay my own systems took, each meeting the terminal its
// own way. A payment that goes through opens the section's next drawing, which plays its own switch. With
// less motion asked for, it is approved at once, nothing moving.
export const PayTerminal: FC<PayTerminalProps> = ({ content, onPaid }: PayTerminalProps) => {
  const isStill = useReducedMotion();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [line, setLine] = useState<{ text: string; press: number } | null>(null);
  const groupId = useId();
  const presses = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;

    return () => clearAll(pending);
  }, []);

  const pay = useCallback((method: PaymentMethodId) => {
    if (phase.kind === "paying") {
      return;
    }

    clearAll(timers.current);
    presses.current += 1;

    const press = presses.current;
    const gesture = PAY_GESTURES[method];
    const approvedMs = approvedMsOf(gesture, PAY_APPS.indexOf(payAppOf(method)), content.amount);

    const approve = () => {
      setPhase({ kind: "approved", method, press });
      setLine({ text: fill(content.approvedLine, { method: content.methods[method] }), press });
      onPaid();
      // Waits for the story to end (the receipt printed, the hands gone), then for the next customer.
      timers.current.push(window.setTimeout(() => setPhase({ kind: "idle" }), isStill ? RESET_MS : payMsOf(gesture) - approvedMs + RESET_MS));
    };

    if (isStill) {
      approve();

      return;
    }

    setPhase({ kind: "paying", method, press });
    timers.current.push(window.setTimeout(approve, approvedMs));
  }, [content, isStill, onPaid, phase.kind]);

  const shown = phase.kind === "idle" ? null : phase;

  // With less motion asked for nothing moves: the counter shows the payment approved at once.
  const mode = shown ? (isStill ? "approved" : "playing") : "idle";

  return (
    <Wrap role="group" aria-label={content.label}>
      <SceneBox>
        <CheckoutScene
          key={shown?.press ?? 0}
          method={shown?.method ?? PAYMENT_GROUPS.cards[0]}
          variant="full"
          mode={mode}
          durationMs={payMsOf(PAY_GESTURES[shown?.method ?? PAYMENT_GROUPS.cards[0]])}
          amount={content.amount}
          accent={THEME_ACCENTS.payments}
        />
      </SceneBox>
      <Side>
        <Hint>{content.hint}</Hint>
        <Groups>
          {PAYMENT_GROUP_ORDER.map((group) => (
            <Group key={group} role="group" aria-labelledby={`${groupId}-${group}`}>
              <GroupName id={`${groupId}-${group}`}>{content.groups[group]}</GroupName>
              <Methods>
                {PAYMENT_GROUPS[group].map((method) => (
                  <MethodButton
                    key={method}
                    type="button"
                    style={faceOf(method)}
                    aria-label={fill(content.payWith, { method: content.methods[method] })}
                    data-current={shown?.method === method ? "" : undefined}
                    aria-disabled={phase.kind === "paying"}
                    onClick={() => pay(method)}
                  >
                    <Mark method={method} size={method === "mastercard" ? 16 : 17} />
                  </MethodButton>
                ))}
              </Methods>
            </Group>
          ))}
        </Groups>
        {/* A new node for every payment, so the same method paid twice is read out again. */}
        <Status role="status">{line && <span key={line.press}>{line.text}</span>}</Status>
      </Side>
    </Wrap>
  );
};

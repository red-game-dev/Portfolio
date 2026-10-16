import { CSSProperties, FC, useCallback, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { APPROVE_SHARE, RESET_MS, TERMINAL_PAY_MS, TERMINAL_SCALE } from "@/components/Payments/config";
import { Mark } from "@/components/Payments/scene/Instrument";
import { PAYMENT_LOOKS } from "@/components/Payments/scene/looks";
import { Qr, Scene, SCENE, ScreenText, ScreenTick } from "@/components/Payments/scene/Scene";
import { PAY_GESTURES, PAYMENT_METHODS, PaymentMethodId } from "@/config/payments";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
    width: calc(${SCENE.width}px * var(--scale));
    height: calc(${SCENE.height}px * var(--scale));

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

    const approve = () => {
      setPhase({ kind: "approved", method, press });
      setLine({ text: fill(content.approvedLine, { method: content.methods[method] }), press });
      onPaid();
      timers.current.push(window.setTimeout(() => setPhase({ kind: "idle" }), RESET_MS));
    };

    if (isStill) {
      approve();

      return;
    }

    setPhase({ kind: "paying", method, press });
    timers.current.push(window.setTimeout(approve, TERMINAL_PAY_MS * APPROVE_SHARE));
  }, [content, isStill, onPaid, phase.kind]);

  const shown = phase.kind === "idle" ? null : phase;

  // A QR method shows its code for the phone to scan; the screen has room for nothing else beside it.
  const isScanning = shown?.kind === "paying" && PAY_GESTURES[shown.method] === "scan";

  const screen = isScanning ? <Qr /> : (
    <>
      {shown?.kind === "approved" && <ScreenTick />}
      <ScreenText>{shown?.kind === "approved" ? content.approved : content.amount}</ScreenText>
      {shown?.kind === "paying" && <ScreenText>{content.processing}</ScreenText>}
    </>
  );

  return (
    <Wrap role="group" aria-label={content.label}>
      <SceneBox>
        <Scene
          key={shown?.press ?? 0}
          method={shown?.method ?? PAYMENT_METHODS[0]}
          durationMs={TERMINAL_PAY_MS}
          isPlaying={Boolean(shown) && !isStill}
          screen={screen}
        />
      </SceneBox>
      <Side>
        <Hint>{content.hint}</Hint>
        <Methods>
          {PAYMENT_METHODS.map((method) => (
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
        {/* A new node for every payment, so the same method paid twice is read out again. */}
        <Status role="status">{line && <span key={line.press}>{line.text}</span>}</Status>
      </Side>
    </Wrap>
  );
};

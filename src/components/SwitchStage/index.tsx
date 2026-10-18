import { FC, Fragment, HTMLAttributes, ReactNode } from "react";

import { isPaymentEffect, PaymentEffect } from "@/components/SwitchStage/config";
import { Stage, SwitchLayer } from "@/components/SwitchStage/effects";
import { Switcher } from "@/components/SwitchStage/useSwitch";

export { default as useSwitch } from "@/components/SwitchStage/useSwitch";
export type { Switcher } from "@/components/SwitchStage/useSwitch";

// Draws a payment's switch: the layer lives with the payments drawings, so the page never carries it.
export type PaymentLayerRender = (effect: PaymentEffect, count: number) => ReactNode;

interface SwitchStageProps extends HTMLAttributes<HTMLDivElement> {
  switcher: Switcher;
  children: ReactNode;
  paymentLayer?: PaymentLayerRender;
}

// Wraps content that switches in place (tab panels, carousel slides, showcase drawings) and plays the
// switch of the universe it sits in. Pair it with useSwitch and call `play` on every switch.
export const SwitchStage: FC<SwitchStageProps> = ({ switcher, children, style, paymentLayer, ...rest }: SwitchStageProps) => {
  const { ref, effect, direction, count } = switcher;
  const stageStyle = {
    "--from-left": direction === 1 ? "0" : "100%",
    "--from-right": direction === 1 ? "100%" : "0",
    "--beam-from": direction === 1 ? "0" : "calc(100cqw - 3px)",
    "--beam-to": direction === 1 ? "calc(100cqw - 3px)" : "0",
    "containerType": "inline-size",
    ...style,
  };

  return (
    <Stage ref={ref} effect={effect} style={stageStyle} {...rest}>
      {effect && (isPaymentEffect(effect)
        ? <Fragment key={count}>{paymentLayer?.(effect, count)}</Fragment>
        : <SwitchLayer key={count} effect={effect} />)}
      {children}
    </Stage>
  );
};

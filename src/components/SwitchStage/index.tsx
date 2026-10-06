import { CSSProperties, FC, HTMLAttributes, ReactNode } from "react";

import { Stage, SwitchLayer } from "@/components/SwitchStage/effects";
import { Switcher } from "@/components/SwitchStage/useSwitch";

export { default as useSwitch } from "@/components/SwitchStage/useSwitch";
export type { Switcher } from "@/components/SwitchStage/useSwitch";

interface SwitchStageProps extends HTMLAttributes<HTMLDivElement> {
  switcher: Switcher;
  children: ReactNode;
}

// Wraps content that switches in place (tab panels, carousel slides, showcase drawings) and plays the
// switch of the universe it sits in. Pair it with useSwitch and call `play` on every switch.
export const SwitchStage: FC<SwitchStageProps> = ({ switcher, children, style, ...rest }: SwitchStageProps) => {
  const { ref, effect, direction, count } = switcher;
  const stageStyle = {
    "--from-left": direction === 1 ? "0" : "100%",
    "--from-right": direction === 1 ? "100%" : "0",
    "--beam-from": direction === 1 ? "0" : "calc(100cqw - 3px)",
    "--beam-to": direction === 1 ? "calc(100cqw - 3px)" : "0",
    "containerType": "inline-size",
    ...style,
  } as CSSProperties;

  return (
    <Stage ref={ref} effect={effect} style={stageStyle} {...rest}>
      {effect && <SwitchLayer key={count} effect={effect} />}
      {children}
    </Stage>
  );
};

import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { toggledMotion } from "@/packages/accessibility/motion";
import { focusRing } from "@/styles/mixins";

interface MotionSwitchProps {
  // Names the switch: what pressing it does ("Keep the page still").
  label: string;
  // A square beside the view switch in the header, or a full row in the phone menu with its label shown.
  variant?: "icon" | "row";
}

// From the small breakpoint up; on a phone the menu carries the switch as a row, leaving the header its room.
const Square = styled.button(({ isPressed }: { isPressed: boolean }) => [
  tw`hidden sm:flex items-center justify-center w-[32px] h-[32px] p-0 cursor-pointer text-[13px] text-white bg-[rgba(16, 16, 16, 0.85)]
     border-[1px] border-solid border-[#2a2a2a] rounded-[2px]`,
  isPressed && tw`border-[var(--accent)] text-[var(--accent)]`,
  css`
    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--accent);
    }
  `,
  focusRing("var(--accent)", 2),
]);

const Row = styled.button(({ isPressed }: { isPressed: boolean }) => [
  tw`flex flex-shrink-0 flex-row items-center justify-center gap-[10px] w-full h-[48px] mt-[10px] cursor-pointer text-sm font-semibold text-white rounded-[8px]`,
  css`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(var(--here-rgb, 196, 210, 255), ${isPressed ? 0.9 : 0.35});

    & > svg {
      color: var(--here, #c4d2ff);
    }
  `,
  focusRing("var(--here, #c4d2ff)", 2),
]);

// The page's own way to keep still (WCAG 2.2.2 asks for one on the page, not only the device's setting): pressed, the
// backdrops, the typing, the falling code and every animation stop; pressed again, they play. It moves the `motion`
// setting, so it is remembered like every other, on the accessibility page's settings and in the terminal too.
export const MotionSwitch: FC<MotionSwitchProps> = ({ label, variant = "icon" }: MotionSwitchProps) => {
  const { set } = usePreferencesStateHook();
  const isReduced = useReducedMotion();
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const onClick = () => set("motion", toggledMotion(isReduced, systemReduced));
  const icon = isReduced ? faPlay : faPause;

  return variant === "row" ? (
    <Row type="button" aria-pressed={isReduced} isPressed={isReduced} onClick={onClick}>
      <FontAwesomeIcon icon={icon} aria-hidden="true" />
      {label}
    </Row>
  ) : (
    <Square type="button" aria-pressed={isReduced} aria-label={label} title={label} isPressed={isReduced} onClick={onClick}>
      <FontAwesomeIcon icon={icon} aria-hidden="true" />
    </Square>
  );
};

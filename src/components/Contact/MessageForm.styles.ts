import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { ActionButton } from "@/components/Controls";
import { focusRing, media } from "@/styles/mixins";

// Each zone's way of greeting a field as it takes focus, of showing a message on its way, and of saying it went, as its
// switches play (the form's `data-effect`, the zone's `SwitchEffect`): a terminal scan in the engineering zone, a neural
// beam in AI, blocks confirming in Web3, a card's shine in the casino, pixels in the game world, a warp streak beyond.
// Only transform and opacity move, once on focus and in a loop while sending, and nothing moves with reduced motion.
const sweepDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  30% { opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
`;

const sweepAcross = keyframes`
  from { transform: translateX(-120%); opacity: 0; }
  25% { opacity: 1; }
  to { transform: translateX(320%); opacity: 0; }
`;

const grow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const flipUp = keyframes`
  from { transform: perspective(200px) rotateX(90deg); }
  to { transform: perspective(200px) rotateX(0); }
`;

const dissolve = keyframes`
  from { opacity: 0.9; }
  to { opacity: 0; }
`;

const settleIn = keyframes`
  from { transform: translateY(6px); opacity: 0; }
  to { transform: none; opacity: 1; }
`;

const outOfWarp = keyframes`
  from { transform: scale(1.18); opacity: 0; }
  to { transform: none; opacity: 1; }
`;

const dealIn = keyframes`
  from { transform: perspective(300px) rotateX(70deg); opacity: 0; }
  to { transform: none; opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(-10px); opacity: 0; }
  to { transform: none; opacity: 1; }
`;

export const Form = tw.form`flex flex-col gap-[14px] m-0`;

export const Heading = tw.h4`m-0 text-base font-semibold text-white`;

export const Intro = tw.p`m-0 text-sm text-[#a3aca7]`;

export const Field = tw.div`flex flex-col gap-[6px]`;

// Holds a field and the trace that greets it on focus, marked `data-frame` for the trace's rules.
export const FieldFrame = tw.div`relative`;

// Over the field, never in the way: a sweep (`::before`) in the zone's style as it takes focus, and a line in the accent
// (`::after`) along its foot for as long as it holds focus, coming in the zone's way.
export const FocusTrace = styled.span`

  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: 2px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    opacity: 0;
  }

  &::before {
    inset: 0;
  }

  &::after {
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: var(--accent);
    transform-origin: left;
  }

  [data-frame]:focus-within &::after {
    opacity: 1;
    animation: ${grow} 0.35s ease-out both;
  }

  [data-frame]:focus-within &::before {
    animation: ${sweepDown} 0.6s ease-out both;
    background: linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), 0.22), transparent);
  }

  [data-effect="beam"] [data-frame]:focus-within &::before {
    right: auto;
    width: 30%;
    animation: ${sweepAcross} 0.7s ease-out both;
    background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.35), transparent);
  }

  [data-effect="beam"] [data-frame]:focus-within &::after {
    transform-origin: center;
  }

  [data-effect="blocks"] [data-frame]:focus-within &::after {
    height: 3px;
    background: repeating-linear-gradient(90deg, var(--accent) 0 10px, transparent 10px 14px);
    animation: ${grow} 0.48s steps(8, end) both;
  }

  [data-effect="blocks"] [data-frame]:focus-within &::before {
    animation: ${dissolve} 0.48s steps(4, end) both;
    background: repeating-linear-gradient(90deg, rgba(var(--accent-rgb), 0.16) 0 10px, transparent 10px 14px);
  }

  [data-effect="pixels"] [data-frame]:focus-within &::after {
    height: 3px;
    animation: ${grow} 0.4s steps(12, end) both;
  }

  [data-effect="pixels"] [data-frame]:focus-within &::before {
    animation: ${dissolve} 0.4s steps(4, end) both;
    background: conic-gradient(rgba(var(--accent-rgb), 0.2) 25%, transparent 0 50%, rgba(var(--accent-rgb), 0.2) 0 75%, transparent 0) 0 0 / 8px 8px;
  }

  [data-effect="deal"] [data-frame]:focus-within &::before {
    right: auto;
    width: 40%;
    animation: ${sweepAcross} 0.6s ease-out both;
    background: linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.18) 50%, transparent 70%);
  }

  [data-effect="deal"] [data-frame]:focus-within &::after {
    transform-origin: bottom;
    animation: ${flipUp} 0.35s ease-out both;
  }

  [data-effect="warp"] [data-frame]:focus-within &::before {
    top: auto;
    right: auto;
    height: 2px;
    width: 45%;
    animation: ${sweepAcross} 0.45s ease-in both;
    background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.9), #ffffff, transparent);
  }

  [data-effect="warp"] [data-frame]:focus-within &::after {
    animation: ${grow} 0.4s ease-out 0.25s both;
  }

  ${media.reducedMotion} {
    &::before {
      display: none;
    }

    [data-frame]:focus-within &::after {
      animation: none;
    }
  }
`;

export const Label = tw.label`text-sm text-[#d6dcd9]`;

// Whether the field must be filled, in words beside its label rather than a mark alone.
export const Marker = tw.span`ml-[6px] text-xs text-[#8a948f]`;

const control = [
  // The border is the field's only edge against the panel behind it, so it keeps 3:1 (WCAG 1.4.11).
  tw`w-full box-border px-[12px] py-[10px] text-sm text-white bg-[#101411] rounded-[2px] border-[1px] border-solid border-[#5f6b65]`,
  css`
    font: inherit;
    min-height: 44px;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: #85928b;
    }

    &[aria-invalid="true"] {
      border-color: #ff8a8a;
    }

    ${media.reducedMotion} {
      transition: none;
    }
  `,
  focusRing("var(--accent)", 2),
];

export const Input = styled.input`
  ${control}
`;

export const TextArea = styled.textarea`
  ${control}

  min-height: 132px;
  resize: vertical;
`;

export const Problem = tw.p`m-0 text-sm text-[#ff9e9e]`;

export const Row = styled.div`
  ${tw`flex flex-col gap-[10px] items-start`}

  ${media.md} {
    flex-direction: row;
    align-items: center;
  }
`;

export const Note = tw.p`m-0 text-xs text-[#8a948f]`;

// What became of the message, said as it changes; once it went, coming in the zone's way.
export const Status = styled.p`
  ${tw`m-0 text-sm text-[#d6dcd9]`}

  &[data-sent="true"] {
    animation: ${settleIn} 0.45s ease-out both;
  }

  [data-effect="beam"] &[data-sent="true"],
  [data-effect="blocks"] &[data-sent="true"] {
    animation-name: ${slideIn};
  }

  [data-effect="pixels"] &[data-sent="true"] {
    animation-timing-function: steps(5, end);
  }

  [data-effect="deal"] &[data-sent="true"] {
    animation-name: ${dealIn};
  }

  [data-effect="warp"] &[data-sent="true"] {
    animation-name: ${outOfWarp};
  }

  ${media.reducedMotion} {
    animation: none;
  }
`;

// The send button, which shows a message on its way in the zone's style: a light that runs over it while it sends.
export const SendButton = styled(ActionButton)`

  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
  }

  &[aria-disabled="true"]::after {
    opacity: 1;
    animation: ${sweepDown} 1s linear infinite;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.4), transparent);
  }

  [data-effect="beam"] &[aria-disabled="true"]::after,
  [data-effect="deal"] &[aria-disabled="true"]::after,
  [data-effect="warp"] &[aria-disabled="true"]::after {
    right: auto;
    width: 40%;
    animation: ${sweepAcross} 1.1s ease-in-out infinite;
    background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  }

  [data-effect="warp"] &[aria-disabled="true"]::after {
    animation-duration: 0.7s;
    animation-timing-function: ease-in;
  }

  [data-effect="blocks"] &[aria-disabled="true"]::after,
  [data-effect="pixels"] &[aria-disabled="true"]::after {
    transform-origin: left;
    animation: ${grow} 1.2s steps(8, end) infinite;
    background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0 8px, transparent 8px 12px);
  }

  ${media.reducedMotion} {
    &[aria-disabled="true"]::after {
      animation: none;
      opacity: 0.25;
    }
  }
`;

// A field people never see, for a bot to fill in: off the screen rather than hidden, which a bot would notice.
export const Trap = styled.div`

  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

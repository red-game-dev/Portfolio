import { FC, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { AI_USAGE_MOTION } from "@/components/AiUsage/config";
import { PlayStateProps } from "@/components/AiUsage/styles";
import { BinaryRain } from "@/components/BinaryRain";
import useInView from "@/hooks/useInView";
import { AiUsageScreen } from "@/packages/insights/ai-usage";

// Scanlines and a vignette over the canvas, so the rain reads as a screen rather than a flat panel.
const Screen = styled.figure(() => [
  tw`relative m-0 h-[240px] lg:h-[300px] overflow-hidden bg-[#0a0f0c] border-[1px] border-solid border-[#1E1E1E] border-t-[transparent]`,
  css`
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0.28) 3px);
    }

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      background: radial-gradient(ellipse at center, rgba(10, 15, 12, 0) 55%, rgba(10, 15, 12, 0.85) 100%);
    }
  `,
]);

const ScanBeam = styled.div(({ isActive }: PlayStateProps) => [
  tw`absolute left-0 right-0 top-0 h-full z-[2] pointer-events-none`,
  css`
    background: linear-gradient(to bottom, rgba(var(--accent-rgb), 0) 0%, rgba(var(--accent-rgb), 0.04) 92%, rgba(var(--accent-rgb), 0.14) 100%);
    animation: scan-beam ${AI_USAGE_MOTION.scanBeamSeconds}s linear infinite;
    animation-play-state: ${isActive ? "running" : "paused"};
    will-change: transform;

    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  `,
]);

const Caption = tw.figcaption`sr-only`;

export const UsageScreen: FC<AiUsageScreen> = ({ message, label }: AiUsageScreen) => {
  const screenRef = useRef<HTMLElement>(null);
  const isVisible = useInView(screenRef, { once: false, threshold: 0 });

  return (
    <Screen ref={screenRef}>
      <BinaryRain message={message} />
      <ScanBeam aria-hidden="true" isActive={isVisible} />
      <Caption>{label}</Caption>
    </Screen>
  );
};

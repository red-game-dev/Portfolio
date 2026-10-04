import { FC } from "react";

import tw, { css, styled } from "twin.macro";

interface JourneyProgressProps {
  progress: number;
  starts: number[];
  zoneIndex: number;
}

interface TickProps {
  isReached: boolean;
}

const Track = tw.div`fixed top-0 left-0 right-0 h-[3px] z-[11] pointer-events-none bg-[rgba(255, 255, 255, 0.04)]`;

// Scaled, not resized, so following the scroll never triggers layout.
const Fill = styled.div(() => [
  tw`absolute inset-0 bg-[#4bffa5]`,
  css`
    transform-origin: left center;
    box-shadow: 0 0 8px rgba(75, 255, 165, 0.6);
    will-change: transform;
  `,
]);

const Tick = styled.span(({ isReached }: TickProps) => [
  tw`absolute top-0 w-[2px] h-[7px] bg-[#2f6b4d]`,
  isReached && tw`bg-[#eafff3]`,
]);

// A thin journey bar across the top, with a tick where each zone begins.
export const JourneyProgress: FC<JourneyProgressProps> = ({ progress, starts, zoneIndex }: JourneyProgressProps) => (
  <Track aria-hidden="true">
    <Fill style={{ transform: `scaleX(${progress})` }} />
    {starts.slice(1).map((start, index) => (
      <Tick key={index} isReached={index + 1 <= zoneIndex} style={{ left: `${start * 100}%` }} />
    ))}
  </Track>
);

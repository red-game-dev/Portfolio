import { forwardRef } from "react";

import tw, { css, styled } from "twin.macro";

interface JourneyProgressProps {
  starts: number[];
  zoneIndex: number;
}

interface TickProps {
  isReached: boolean;
}

const Track = tw.div`fixed top-0 left-0 right-0 h-[3px] z-[11] pointer-events-none bg-[rgba(255, 255, 255, 0.04)]`;

// Scaled, not resized, so following the scroll never triggers layout.
const Fill = styled.div(() => [
  tw`absolute inset-0 bg-[var(--accent)]`,
  css`
    transform-origin: left center;
    transform: scaleX(var(--journey-progress, 0));
    box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.6);
    will-change: transform;
  `,
]);

const Tick = styled.span(({ isReached }: TickProps) => [
  tw`absolute top-0 w-[2px] h-[7px] bg-[var(--accent-muted)]`,
  isReached && tw`bg-[#eafff3]`,
]);

// A thin journey bar across the top, with a tick where each zone begins. The fill follows
// --journey-progress, written on the bar by useJourney, so scrolling never re-renders it.
export const JourneyProgress = forwardRef<HTMLDivElement, JourneyProgressProps>(({ starts, zoneIndex }, ref) => (
  <Track ref={ref} aria-hidden="true">
    <Fill />
    {starts.slice(1).map((start, index) => (
      <Tick key={index} isReached={index + 1 <= zoneIndex} style={{ left: `${start * 100}%` }} />
    ))}
  </Track>
));

JourneyProgress.displayName = "JourneyProgress";

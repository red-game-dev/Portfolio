import { FC, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import useAnimationProgress from "@/hooks/useAnimationProgress";
import useInView from "@/hooks/useInView";
import { formatNumber } from "@/packages/text/format";
import { hiddenWhenReduced, media } from "@/styles/mixins";

interface SquaresProps {
  count: number;
  label: string;
}

// One square per pull request: 6px squares on an 8px pitch.
const PITCH = 8;
// Narrow until the grid has measured itself, so the first paint never pushes past a phone's width.
const MIN_COLUMNS = 10;
// How long the squares take to pour in, corner to corner, and the count to climb with them.
const CASCADE_MS = 1300;

// Squares are painted by two gradients over a solid fill, so even 500 of them are two elements, not 500.
const squares = css`
  background-color: var(--accent);
  background-image: linear-gradient(90deg, #101010 2px, transparent 2px), linear-gradient(#101010 2px, transparent 2px);
  background-size: ${PITCH}px ${PITCH}px;
`;

// The squares pour in from the top left corner in a diagonal wave: a mask, opaque on one side of its edge, slides
// from the far corner to the near one.
const cascade = keyframes`
  from { -webkit-mask-position: 100% 100%; mask-position: 100% 100%; }
  to { -webkit-mask-position: 0 0; mask-position: 0 0; }
`;

// A bright band riding the wave's edge.
const crest = keyframes`
  from { transform: translate(-55%, -55%); opacity: 1; }
  85% { opacity: 1; }
  to { transform: translate(55%, 55%); opacity: 0; }
`;

const Grid = styled.div(({ isShown }: { isShown: boolean }) => [
  tw`relative w-full min-w-0 overflow-hidden`,
  css`
    -webkit-mask-image: linear-gradient(135deg, #000 0 40%, transparent 60% 100%);
    mask-image: linear-gradient(135deg, #000 0 40%, transparent 60% 100%);
    -webkit-mask-size: 300% 300%;
    mask-size: 300% 300%;
    -webkit-mask-position: 100% 100%;
    mask-position: 100% 100%;

    &::after {
      content: "";
      position: absolute;
      inset: -50%;
      pointer-events: none;
      background: linear-gradient(135deg, transparent 44%, rgba(var(--accent-rgb), 0.6) 50%, transparent 56%);
      opacity: 0;
    }
  `,
  isShown && css`
    animation: ${cascade} ${CASCADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both;

    &::after {
      animation: ${crest} ${CASCADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both;
    }
  `,
  css`
    ${media.reducedMotion} {
      -webkit-mask-image: none;
      mask-image: none;
      animation: none;

      &::after {
        display: none;
      }
    }
  `,
]);

const Rows = styled.div(() => [tw`block`, squares]);

const Remainder = styled.div(() => [tw`block`, squares]);

const Count = styled.span(() => [tw`block text-2xl font-semibold leading-none text-[var(--accent)]`, hiddenWhenReduced]);

// With less motion asked for, the whole count stands still.
const StillCount = styled.span(() => [
  tw`hidden text-2xl font-semibold leading-none text-[var(--accent)]`,
  css`
    ${media.reducedMotion} {
      display: block;
    }
  `,
]);

const ReadableText = tw.span`sr-only`;

// The squares pour in corner to corner as the grid comes into view, the count climbing with them, and pour in again
// when the reader comes back to them.
export const Squares: FC<SquaresProps> = ({ count, label }: SquaresProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(MIN_COLUMNS);
  const isShown = useInView(gridRef, { threshold: 0.3 });
  const counted = useAnimationProgress(isShown, CASCADE_MS);

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) {
      return;
    }

    const observer = new ResizeObserver(() => setColumns(Math.max(MIN_COLUMNS, Math.floor(grid.clientWidth / PITCH))));

    observer.observe(grid);

    return () => observer.disconnect();
  }, []);

  const fullRows = Math.floor(count / columns);
  const remainder = count % columns;

  return (
    <>
      <Count aria-hidden="true">{formatNumber(Math.round(count * counted))}</Count>
      <StillCount aria-hidden="true">{formatNumber(count)}</StillCount>
      <Grid ref={gridRef} isShown={isShown}>
        <ReadableText>{`${formatNumber(count)}. ${label}`}</ReadableText>
        <Rows aria-hidden="true" style={{ width: columns * PITCH, height: fullRows * PITCH }} />
        {remainder > 0 && <Remainder aria-hidden="true" style={{ width: remainder * PITCH, height: PITCH }} />}
      </Grid>
    </>
  );
};

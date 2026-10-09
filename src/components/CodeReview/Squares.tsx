import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import useScrollProgressVar from "@/hooks/useScrollProgressVar";
import { media } from "@/styles/mixins";

interface SquaresProps {
  count: number;
  label: string;
}

// One square per pull request: 6px squares on an 8px pitch.
const PITCH = 8;
// Narrow until the grid has measured itself, so the first paint never pushes past a phone's width.
const MIN_COLUMNS = 10;

// Squares are painted by two gradients over a solid fill, so even 500 of them are two elements, not 500.
const squares = css`
  background-color: var(--accent);
  background-image: linear-gradient(90deg, #101010 2px, transparent 2px), linear-gradient(#101010 2px, transparent 2px);
  background-size: ${PITCH}px ${PITCH}px;
`;

const Grid = styled.div(() => [
  tw`relative w-full min-w-0 overflow-hidden`,
  css`
    clip-path: inset(0 0 calc((1 - var(--squares-progress, 0)) * 100%) 0);

    ${media.reducedMotion} {
      clip-path: none;
    }
  `,
]);

const Rows = styled.div(() => [tw`block`, squares]);

const Remainder = styled.div(() => [tw`block`, squares]);

const ReadableText = tw.span`sr-only`;

// The grid fills from the top as the reader scrolls past it.
export const Squares: FC<SquaresProps> = ({ count, label }: SquaresProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(MIN_COLUMNS);

  useScrollProgressVar(gridRef, "--squares-progress", 0.85);

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
    <Grid ref={gridRef}>
      <ReadableText>{label}</ReadableText>
      <Rows aria-hidden="true" style={{ width: columns * PITCH, height: fullRows * PITCH }} />
      {remainder > 0 && <Remainder aria-hidden="true" style={{ width: remainder * PITCH, height: PITCH }} />}
    </Grid>
  );
};

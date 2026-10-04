import { FC } from "react";

import tw, { css, styled } from "twin.macro";

interface BitStripProps {
  cells: number;
  isActive: boolean;
  // Delay before the first cell lights, in milliseconds.
  delay?: number;
  // Delay between cells, in milliseconds.
  step?: number;
}

interface CellProps {
  isLit: boolean;
}

const Strip = tw.span`flex flex-row gap-[2px] h-[4px]`;

// The lit fill only changes opacity, so a sweep across many cells costs the compositor, not a repaint.
const Cell = styled.span(({ isLit }: CellProps) => [
  tw`relative flex-1 rounded-[1px] bg-[#1d1d1d]`,
  css`
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: #4bffa5;
      box-shadow: 0 0 4px rgba(75, 255, 165, 0.45);
      opacity: ${isLit ? 1 : 0};
      transition: opacity 0.25s ease-out;
      transition-delay: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      &::before {
        transition: none;
      }
    }
  `,
]);

// A row of bits that lights left to right once its owner is on screen. Decorative.
export const BitStrip: FC<BitStripProps> = ({ cells, isActive, delay = 0, step = 18 }: BitStripProps) => (
  <Strip aria-hidden="true">
    {Array.from({ length: cells }, (_, index) => (
      <Cell key={index} isLit={isActive} style={{ transitionDelay: `${delay + index * step}ms` }} />
    ))}
  </Strip>
);

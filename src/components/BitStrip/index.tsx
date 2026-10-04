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

interface StripProps {
  isActive: boolean;
}

// One styled element per strip; the cells are plain spans styled from here. Hundreds of styled cells
// would each compute their own styles while the page hydrates.
const Strip = styled.span(({ isActive }: StripProps) => [
  tw`flex flex-row gap-[2px] h-[4px]`,
  css`
    & > span {
      position: relative;
      flex: 1 1 0%;
      border-radius: 1px;
      background: #1d1d1d;
    }

    & > span::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: #4bffa5;
      box-shadow: 0 0 4px rgba(75, 255, 165, 0.45);
      opacity: ${isActive ? 1 : 0};
      transition: opacity 0.25s ease-out;
      transition-delay: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      & > span::before {
        transition: none;
      }
    }
  `,
]);

// A row of bits that lights left to right once its owner is on screen. Decorative.
export const BitStrip: FC<BitStripProps> = ({ cells, isActive, delay = 0, step = 18 }: BitStripProps) => (
  <Strip isActive={isActive} aria-hidden="true">
    {Array.from({ length: cells }, (_, index) => (
      <span key={index} style={{ transitionDelay: `${delay + index * step}ms` }} />
    ))}
  </Strip>
);

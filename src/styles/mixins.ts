import { css } from "styled-components";

// Media queries for rules a utility class cannot reach: Tailwind's md, lg and xl breakpoints, each from that width
// up, and a reader who asked for less motion. Write `${media.md} { ... }` inside a css block.
export const media = {
  md: "@media (min-width: 768px)",
  lg: "@media (min-width: 1024px)",
  xl: "@media (min-width: 1280px)",
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
};

// For a reader who asked for less motion: no animation, no transition, or not shown at all (a purely
// decorative moving part).
export const noAnimationWhenReduced = css`
  ${media.reducedMotion} {
    animation: none;
  }
`;

export const noTransitionWhenReduced = css`
  ${media.reducedMotion} {
    transition: none;
  }
`;

export const hiddenWhenReduced = css`
  ${media.reducedMotion} {
    display: none;
  }
`;

// Keeps the hidden attribute working on an element whose class sets a display, which would otherwise override it.
export const honourHidden = css`
  &[hidden] {
    display: none;
  }
`;

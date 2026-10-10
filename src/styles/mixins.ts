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

interface SquareBulletOptions {
  // The square's side, in px.
  size?: number;
  // How far down the first line it sits.
  top?: string;
  colour?: string;
  // Rounded corners, in px, where the list wants them softer.
  radius?: number;
}

// A small square bullet before a list item. The item keeps position: relative and the padding on its left that
// the square sits in.
export const squareBullet = ({ size = 6, top = "0.6em", colour = "var(--accent)", radius }: SquareBulletOptions = {}) => css`
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: ${top};
    width: ${size}px;
    height: ${size}px;
    ${radius === undefined ? "" : `border-radius: ${radius}px;`}
    background: ${colour};
  }
`;

// An inline SVG child drawn to fill its box, as the pixel sprites are.
export const svgFill = css`
  & > svg {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

// Text filled with the zone's accent up to `progress` (the name of a CSS variable from 0 to 1) and `rest` after
// it, with a hard edge between: a progress bar written in the letters themselves.
export const progressText = (direction: "bottom" | "right", progress: string, rest: string) => css`
  background-image: linear-gradient(
    to ${direction},
    var(--accent) calc(var(${progress}, 0) * 100%),
    ${rest} calc(var(${progress}, 0) * 100%)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

// Filled with the zone's accent, dark text over it, on hover and keyboard focus, its colours easing over;
// `withBorder` fills the border too, for a control outlined in a muted accent.
export const accentFillOnHover = (withBorder = false) => (withBorder
  ? css`
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
      border-color: var(--accent);
    }
  `
  : css`
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
    }
  `);

// A little brighter on hover and keyboard focus, for a control whose colours should stay as they are.
export const brightenOnHover = css`
  transition: filter 0.2s ease;

  &:hover,
  &:focus-visible {
    filter: brightness(1.12);
  }
`;

// A 2px outline in `colour` on keyboard focus, `offset` px out from the edge (in from it when negative).
export const focusRing = (colour: string, offset?: number) => css`
  &:focus-visible {
    outline: 2px solid ${colour};
    ${offset === undefined ? "" : `outline-offset: ${offset}px;`}
  }
`;

// The voyage's panels over open space: deep blue, see through by `fill`, with a pale rim of `rim` opacity.
export const voyagePanel = (fill = 0.72, rim = 0.25) => css`
  background: rgba(5, 8, 18, ${fill});
  border: 1px solid rgba(196, 210, 255, ${rim});
`;

import tw, { css, styled } from "twin.macro";

// The column every section of the journey sits in, above the backdrop, clear of the fixed rails. A jump to a section
// lands it at the top of the screen: its scroll margin cancels the page's scroll padding, which is there to keep
// focused controls clear of the fixed bars.
// Once the page has laid out every section (the body's data-skip-sections, set by Layout as the intro lifts), the
// browser skips the sections off the screen, each held at the size it had when last drawn (contain-intrinsic-size:
// auto; the first layout gives every section its real size, so nothing moves and every jump lands where it did; after a
// view switch or a turn of the phone, one off the screen keeps its old size until it comes near, and the browser's scroll
// anchoring keeps what is on the screen in place as it changes). A style change then costs only what is
// on or near the screen: the rules a section's code adds as it loads (each @media or @keyframes rule restyles the whole
// page) cost a sixth of what they did. A section whose painting reaches past its own box (the cover's fixed picture)
// carries data-always-painted and is never skipped.
export const Section = styled.div(() => [
  tw`relative px-[20px] md:px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`,
  css`
    scroll-margin-top: calc(-1 * var(--bars-top, 0px));
    contain-intrinsic-size: auto 900px;

    [data-skip-sections] &:not([data-always-painted]) {
      content-visibility: auto;
    }
  `,
]);

// A link target at the very top of a section, for the role, audience and industry links of the first
// screen, so a section can answer to more than its own id; like the section, it cancels the page's scroll padding,
// so a jump to it lands the section at the top.
export const Anchor = styled.span(() => [
  tw`absolute top-0 left-0`,
  css`
    scroll-margin-top: calc(-1 * var(--bars-top, 0px));
  `,
]);

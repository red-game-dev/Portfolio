import tw, { css, styled } from "twin.macro";

// The column every section of the journey sits in, above the backdrop, clear of the fixed rails. A jump to a section
// lands it at the top of the screen: its scroll margin cancels the page's scroll padding, which is there to keep
// focused controls clear of the fixed bars.
export const Section = styled.div(() => [
  tw`relative px-[20px] md:px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`,
  css`
    scroll-margin-top: calc(-1 * var(--bars-top, 0px));
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

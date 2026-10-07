import tw from "twin.macro";

// The column every section of the journey sits in, above the backdrop, clear of the fixed rails.
export const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// A link target at the very top of a section, for the role, audience and industry links of the first
// screen, so a section can answer to more than its own id.
export const Anchor = tw.span`absolute top-0 left-0`;

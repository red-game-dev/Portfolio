import tw from "twin.macro";

// The bordered dark panel used by the newer sections, so they share one surface and spacing.
export const Panel = tw.div`relative p-[25px] lg:p-[35px] bg-[#101010] border-[1px] border-solid border-[#1E1E1E]`;

export const PanelTitle = tw.h3`relative m-[0 0 15px 0] text-xl font-semibold text-white`;

export const PanelText = tw.p`m-[0 0 10px 0] max-w-[70ch] break-words`;

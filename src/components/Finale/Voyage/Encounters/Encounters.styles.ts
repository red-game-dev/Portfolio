import tw, { styled } from "twin.macro";

import { focusRing } from "@/styles/mixins";

// Who keeps a station, under its name.
export const PortNote = tw.p`m-0 px-[16px] pb-[8px] text-xs md:text-sm text-[#aab3c9]`;

// The perks offered, one button each: its name, what it does and how many times the run has taken it.
export const PerkList = tw.ul`m-0 p-0 list-none flex flex-col gap-[10px]`;

export const PerkButton = styled.button`
  ${tw`flex flex-col items-start gap-[4px] w-full p-[12px] text-left cursor-pointer text-white`}

  background: rgba(255, 215, 106, 0.06);
  border: 1px solid rgba(255, 215, 106, 0.45);

  &:hover {
    background: rgba(255, 215, 106, 0.14);
  }

  ${focusRing("#ffd76a", 2)}
`;

export const PerkName = tw.span`text-sm md:text-base font-semibold text-[#ffd76a]`;

export const PerkNote = tw.span`text-xs md:text-sm text-[#c9cfdf] leading-relaxed`;

export const PerkTaken = tw.span`text-[11px] text-[#9aa3bb] tabular-nums`;

// The way to dock at the port alongside, first among the frames over the view.
export const DockButton = styled.button`
  ${tw`flex flex-row items-center justify-center gap-[8px] px-[12px] py-[8px] text-xs md:text-sm font-semibold cursor-pointer text-[#05140c] bg-[#7dffb0] border-0
     pointer-events-auto`}

  box-shadow: 0 0 0 1px rgba(125, 255, 176, 0.4), 0 0 18px rgba(125, 255, 176, 0.35);

  ${focusRing("#ffffff", 2)}
`;

// A call for help as the HUD shows it, amber.
export const DistressFrame = styled.section`
  ${tw`flex flex-col gap-[4px] p-[6px] text-[11px] md:text-xs font-semibold text-[#ffe2b8] bg-[rgba(36,22,4,0.78)]`}

  border: 1px solid rgba(255, 179, 71, 0.6);
`;

// A boss's great attack coming, under its frame.
export const BossTell = tw.p`m-0 text-[11px] md:text-xs font-bold text-[#ff8a96]`;

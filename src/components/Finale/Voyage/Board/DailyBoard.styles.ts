import tw, { styled } from "twin.macro";

import { focusRing } from "@/styles/mixins";

export const BoardBlock = styled.section`
  ${tw`flex flex-col gap-[8px] p-[12px] text-left`}

  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 215, 106, 0.3);
`;

export const BoardTitle = tw.h3`m-0 text-sm font-semibold text-[#ffd76a]`;

export const BoardList = tw.ol`m-0 p-0 list-none flex flex-col gap-[2px] text-sm tabular-nums`;

export const BoardRow = styled.li(({ isMine }: { isMine: boolean }) => [
  tw`flex flex-row justify-between gap-[10px] px-[8px] py-[3px]`,
  isMine ? tw`text-[#101010] bg-[#ffd76a] font-semibold` : tw`text-[#e6e9f2]`,
]);

export const BoardForm = tw.form`flex flex-row flex-wrap items-end gap-[8px]`;

export const BoardLabel = tw.label`flex flex-col gap-[4px] text-xs text-[#aab3c9]`;

export const InitialsInput = styled.input`
  ${tw`w-[88px] px-[10px] py-[6px] text-base font-semibold tracking-[0.3em] uppercase text-white bg-transparent border-[1px] border-solid border-[#3a4566]`}
  ${focusRing("#ffd76a", 2)}
`;

export const BoardNote = tw.p`m-0 text-xs text-[#aab3c9] leading-relaxed`;

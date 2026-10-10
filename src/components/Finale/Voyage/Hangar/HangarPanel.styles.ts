import tw, { css, styled } from "twin.macro";

import { focusRing, honourHidden } from "@/styles/mixins";


// How each rarity is coloured wherever a thing is named.
export const RARITY_COLOUR: Record<"common" | "uncommon" | "rare" | "epic" | "legendary", string> = {
  common: "#aab3c9",
  uncommon: "#6ee7a8",
  rare: "#4fd8ff",
  epic: "#c58bff",
  legendary: "#ffc45c",
};

// A drawer along the right on wide screens, the whole screen on a phone, over the voyage.
export const Panel = styled.section(() => [
  tw`absolute top-0 right-0 bottom-0 flex flex-col w-full md:w-[440px] text-white`,
  css`
    --accent: #c4d2ff;
    background: #05081a;
    border-left: 1px solid rgba(196, 210, 255, 0.3);
    z-index: 2;
  `,
]);

export const Header = tw.div`flex flex-row items-center justify-between gap-[12px] px-[16px] pt-[14px] pb-[10px]`;

export const Heading = tw.h2`m-0 text-lg md:text-xl font-semibold text-white outline-none`;

export const Purse = tw.p`m-0 flex flex-row gap-[12px] text-sm font-semibold tabular-nums text-[#ffd76a]`;

export const Shards = tw.span`text-[#c58bff]`;

export const Tabs = tw.div`px-[16px]`;

export const Body = styled.div(() => [
  tw`flex-1 min-h-0 overflow-y-auto px-[16px] pt-[12px] pb-[18px]`,
  css`
    scrollbar-width: thin;
    overscroll-behavior: contain;
  `,
]);

export const TabPanel = styled.div(() => [tw`flex flex-col gap-[14px]`, honourHidden]);

export const Subheading = tw.h3`m-0 text-sm font-semibold text-[#c4d2ff]`;

export const Note = tw.p`m-0 text-xs md:text-sm text-[#aab3c9] leading-relaxed`;

export const ShipName = tw.p`m-0 text-xl font-semibold text-white`;

// Each stat with what the next level makes it, where it changes.
export const Stats = styled.dl(() => [
  tw`m-0 grid gap-x-[12px] gap-y-[4px] text-xs md:text-sm tabular-nums`,
  css`
    grid-template-columns: 1fr auto auto;
  `,
]);

// A stat's name, value and next value, laid out by the grid around it.
export const StatRow = tw.div`contents`;

export const StatName = tw.dt`text-[#9aa3bb]`;

export const StatValue = tw.dd`m-0 text-right text-white`;

export const StatNext = tw.dd`m-0 text-right text-[#6ee7a8]`;

export const Block = styled.section(() => [
  tw`flex flex-col gap-[8px] p-[12px]`,
  css`
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(196, 210, 255, 0.16);
  `,
]);

export const Needs = tw.ul`m-0 p-0 list-none flex flex-col gap-[4px] text-xs md:text-sm tabular-nums`;

export const Need = styled.li(({ isMet }: { isMet: boolean }) => [
  tw`flex flex-row justify-between gap-[10px]`,
  isMet ? tw`text-[#c9cfdf]` : tw`text-[#ff9aa5]`,
]);

export const Items = tw.ul`m-0 p-0 list-none flex flex-col gap-[8px]`;

export const Item = styled.li(() => [
  tw`flex flex-col gap-[4px] p-[10px]`,
  css`
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(196, 210, 255, 0.12);
  `,
]);

export const ItemTop = tw.div`flex flex-row items-baseline justify-between gap-[10px]`;

export const ItemName = styled.p(({ colour }: { colour: string }) => [
  tw`m-0 text-sm font-semibold`,
  css`
    color: ${colour};
  `,
]);

export const ItemCount = tw.span`text-xs text-[#9aa3bb] tabular-nums whitespace-nowrap`;

export const Actions = tw.div`flex flex-row flex-wrap gap-[8px] mt-[2px]`;

// Small actions inside the panel, quieter than the cards' buttons.
export const SmallButton = styled.button(({ isPrimary = false }: { isPrimary?: boolean }) => [
  tw`px-[10px] py-[6px] text-xs font-semibold cursor-pointer border-[1px] border-solid`,
  isPrimary ? tw`text-[#101010] bg-[#c4d2ff] border-[#c4d2ff]` : tw`text-white bg-transparent border-[#3a4566]`,
  css`
    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    ${focusRing("#c4d2ff", 2)}
  `,
]);

// The bar's four slots as the Loadout lists them, each edged in the colour of what it holds.
export const LoadoutSlots = tw.ol`m-0 p-0 list-none flex flex-col gap-[6px] text-xs md:text-sm`;

export const LoadoutSlot = styled.li(({ colour }: { colour: string }) => [
  tw`flex flex-row flex-wrap items-center gap-[8px] px-[8px] py-[6px]`,
  css`
    color: #ffffff;
    border-left: 3px solid ${colour};
    background: rgba(255, 255, 255, 0.03);

    & > svg {
      color: ${colour};
    }

    & > button {
      margin-left: auto;
    }
  `,
]);

export const Meter = tw.div`relative h-[6px] overflow-hidden bg-[rgba(255,255,255,0.12)]`;

export const Entries = tw.ol`m-0 p-0 list-none flex flex-col gap-[6px] text-xs md:text-sm`;

export const Entry = tw.li`flex flex-row items-baseline justify-between gap-[10px]`;

export const Amount = styled.span(({ isGain }: { isGain: boolean }) => [
  tw`tabular-nums whitespace-nowrap font-semibold`,
  isGain ? tw`text-[#6ee7a8]` : tw`text-[#ff9aa5]`,
]);

export const Footer = styled.div(() => [
  tw`flex flex-col gap-[8px] px-[16px] py-[12px]`,
  css`
    border-top: 1px solid rgba(196, 210, 255, 0.16);
  `,
]);

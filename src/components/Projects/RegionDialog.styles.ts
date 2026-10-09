import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { actionStyle } from "@/components/Controls";
import { Image } from "@/components/Image";
import { media } from "@/styles/mixins";

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

export const unfold = keyframes`
  from { opacity: 0; transform: scale(0.94); clip-path: inset(48% 0 48% 0); }
  to { opacity: 1; transform: none; clip-path: inset(0 0 0 0); }
`;

// The map screen of a region, opened like a game's map: it unfolds from a line into the full view.
export const Dialog = styled.dialog(() => [
  tw`w-[calc(100% - 24px)] max-w-[920px] max-h-[90vh] p-0 overflow-hidden text-left text-[#ccc] bg-[#0b0b0b]
     border-[1px] border-solid border-[var(--kind)]`,
  css`
    box-shadow: 0 0 50px color-mix(in srgb, var(--kind) 25%, transparent);
    --action: var(--kind);
    --action-muted: #2a2a2a;

    &[open] {
      animation: ${unfold} 0.4s cubic-bezier(0.165, 0.85, 0.45, 1);
    }

    &::backdrop {
      background: rgba(5, 5, 5, 0.78);
      backdrop-filter: blur(3px);
    }

    ${media.reducedMotion} {
      &[open] {
        animation: none;
      }
    }
  `,
]);

export const Scroll = tw.div`max-h-[90vh] overflow-y-auto`;

export const Header = tw.header`flex flex-row items-center gap-[14px] p-[18px] md:p-[22px] pr-[56px] border-0 border-b-[1px] border-solid border-[#1E1E1E]`;

export const Badge = styled.span(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[52px] h-[58px] text-xl text-[#101010] bg-[var(--kind)]`,
  css`
    clip-path: ${HEX};
  `,
]);

export const Heading = tw.div`flex flex-col gap-[6px] min-w-0`;

export const Title = tw.h3`m-0 text-lg md:text-2xl font-semibold text-white`;

export const Chips = tw.div`flex flex-row flex-wrap gap-[6px] text-xs`;

export const Chip = styled.span(({ isKind }: { isKind?: boolean }) => [
  tw`leading-none py-[5px] px-[8px] rounded-full border-[1px] border-solid border-[#2a2a2a] text-[#bbb]`,
  isKind && tw`text-[var(--kind)] border-[var(--kind)]`,
]);

export const Close = tw.button`absolute top-[14px] right-[14px] z-[3] flex items-center justify-center w-[36px] h-[36px] cursor-pointer text-lg
text-[#999] bg-transparent border-0 hover:text-white`;

export const Body = styled.div(() => [
  tw`grid gap-[22px] p-[18px] md:p-[22px]`,
  css`
    ${media.md} {
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    }
  `,
]);

// The region's view: its screenshot under a map grid, or its own terrain when there is no picture.
export const View = styled.div(() => [
  tw`relative overflow-hidden min-h-[200px] md:min-h-[300px] bg-[#101010] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    background-image:
      linear-gradient(color-mix(in srgb, var(--kind) 10%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--kind) 10%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.7);
    }
  `,
]);

export const ViewImage = styled(Image)(() => [
  tw`object-cover`,
]);

export const ViewIcon = tw.span`absolute inset-0 flex items-center justify-center text-[96px] text-[var(--kind)] opacity-80`;

export const Log = tw.div`flex flex-col gap-[16px]`;

export const Intro = tw.p`m-0 text-sm md:text-base text-[#ddd] break-words`;

export const GroupHeading = tw.h4`m-0 text-xs font-semibold text-[var(--kind)]`;

export const Objectives = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px] text-sm`;

export const Objective = styled.li(() => [
  tw`relative pl-[24px] break-words`,
  css`
    &::before {
      content: "\\2713";
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      height: 16px;
      font-size: 11px;
      line-height: 16px;
      text-align: center;
      color: #101010;
      background: var(--kind);
    }
  `,
]);

export const Loot = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

export const LootItem = tw.li`text-xs leading-none text-[#eee] bg-[#1a1a1a] rounded-[2px] py-[6px] px-[8px] border-[1px] border-solid border-[#2a2a2a]`;

// A venture of my own goes deeper: its numbers, then how it was built and what users moved through.
export const Deep = tw.section`flex flex-col gap-[14px] px-[18px] pb-[18px] md:px-[22px] md:pb-[22px]`;

export const DeepHeading = tw.h3`m-0 text-base font-semibold text-white`;

export const Stats = tw.ul`list-none m-0 p-0 grid gap-[10px] grid-cols-2 md:grid-cols-4`;

export const Stat = tw.li`flex flex-col gap-[4px] p-[12px] bg-[#111] border-[1px] border-solid border-[#222]`;

export const StatValue = tw.span`text-2xl font-semibold leading-none text-[var(--kind)]`;

export const StatLabel = tw.span`text-xs text-[#aaa]`;

export const DeepNote = tw.p`m-0 text-sm text-[#bbb] max-w-[70ch]`;


export const Footer = tw.footer`flex flex-col md:flex-row md:items-center md:justify-between gap-[12px] p-[18px] md:p-[22px]
border-0 border-t-[1px] border-solid border-[#1E1E1E]`;

export const Group = tw.div`flex flex-row flex-wrap gap-[10px]`;

export const Travel = styled.button(() => [
  ...actionStyle(false),
  tw`max-w-full md:max-w-[220px] disabled:opacity-30 disabled:cursor-default`,
]);

export const TravelName = tw.span`truncate`;

import tw, { css, styled } from "twin.macro";

import { focusRing } from "@/styles/mixins";

// The top of the sheet: the pilot's level and the ship's enhancement, as an MMO's character sheet heads its page.
export const SheetHead = tw.div`flex flex-col gap-[6px]`;

export const Totals = tw.div`flex flex-row flex-wrap items-center gap-[10px] text-xs font-semibold tabular-nums`;

export const Total = styled.span(({ colour }: { colour: string }) => [
  tw`flex flex-row items-center gap-[4px]`,
  css`
    color: ${colour};
  `,
]);

// The ship in the middle with its pieces round it: a column each side, and the pieces a greater ship grows below.
export const Doll = styled.div(() => [
  tw`grid gap-[6px]`,
  css`
    grid-template-columns: 1fr minmax(96px, 1.1fr) 1fr;
    grid-template-areas:
      "left ship right"
      "below below below";
  `,
]);

export const Column = styled.div(({ area }: { area: "left" | "right" }) => [
  tw`flex flex-col gap-[6px]`,
  css`
    grid-area: ${area};
  `,
]);

export const Below = styled.div(() => [
  tw`grid gap-[6px]`,
  css`
    grid-area: below;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  `,
]);

export const ShipFrame = styled.div(() => [
  tw`relative flex items-center justify-center`,
  css`
    grid-area: ship;
    background: radial-gradient(circle at 50% 45%, rgba(196, 210, 255, 0.12), rgba(5, 8, 26, 0) 70%);
  `,
]);

export const ShipCanvas = tw.canvas`w-full h-full max-h-[260px]`;

// One piece's place: its icon, its name in its rarity's colour, its level and its enhancement; dim and locked
// where the ship has not grown it yet; lit when chosen.
export const Slot = styled.button(({ colour, isChosen, isLocked }: { colour: string; isChosen: boolean; isLocked: boolean }) => [
  tw`flex flex-col items-start gap-[2px] min-w-0 px-[6px] py-[5px] text-left cursor-pointer text-white`,
  css`
    background: ${isChosen ? "rgba(196, 210, 255, 0.14)" : "rgba(255, 255, 255, 0.03)"};
    border: 1px solid ${isChosen ? "#c4d2ff" : isLocked ? "rgba(196, 210, 255, 0.1)" : `${colour}88`};
    opacity: ${isLocked ? 0.5 : 1};

    ${focusRing("#c4d2ff", 2)}
  `,
]);

export const SlotTop = tw.span`flex flex-row items-center gap-[5px] w-full text-[10px] text-[#9aa3bb]`;

export const SlotName = styled.span(({ colour }: { colour: string }) => [
  tw`block w-full text-[11px] font-semibold truncate`,
  css`
    color: ${colour};
  `,
]);

export const SlotLevel = tw.span`ml-auto tabular-nums text-[#c9cfdf]`;

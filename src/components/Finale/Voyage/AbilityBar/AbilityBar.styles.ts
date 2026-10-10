import tw, { css, styled } from "twin.macro";

import { hexWithAlpha } from "@/packages/graphics/colour";
import { focusRing, media, voyagePanel } from "@/styles/mixins";

// Down the right edge on a phone, within a thumb's reach and clear of the radar and the telemetry; along the
// bottom, between them, where there is room.
export const Bar = styled.div(() => [
  tw`absolute flex flex-col gap-[6px] p-[4px] pointer-events-auto`,
  css`
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    ${voyagePanel(0.55, 0.2)}

    ${media.md} {
      right: auto;
      top: auto;
      left: 50%;
      bottom: 18px;
      flex-direction: row;
      transform: translateX(-50%);
    }
  `,
]);

// One slot: square, a touch target on a phone, edged in the colour of where its boost is from.
export const Slot = styled.button(({ colour, isEmpty, isOn }: { colour: string; isEmpty: boolean; isOn: boolean }) => [
  tw`relative flex items-center justify-center w-[46px] h-[46px] md:w-[44px] md:h-[44px] p-0 cursor-pointer overflow-hidden text-white`,
  css`
    --slot: ${colour};
    background: rgba(10, 14, 30, 0.85);
    border: 1px ${isEmpty ? "dashed" : "solid"} ${isEmpty ? "#3a4566" : hexWithAlpha(colour, 0.55)};
    border-radius: 6px;
    box-shadow: ${isOn ? `0 0 0 1px ${colour}, 0 0 14px ${hexWithAlpha(colour, 0.6)}` : "none"};
    font-size: 18px;

    ${focusRing("#ffffff", 2)}
  `,
]);

export const SlotIcon = styled.span(({ isSpent }: { isSpent: boolean }) => [
  tw`flex`,
  css`
    color: var(--slot);
    opacity: ${isSpent ? 0.35 : 1};
  `,
]);

// The key that uses it, left out where there is no keyboard to press it with.
export const SlotKey = styled.span(() => [
  tw`absolute top-[2px] left-[4px] text-[9px] font-semibold text-[#9aa3bb] leading-none`,
  css`
    @media (hover: none) and (pointer: coarse) {
      display: none;
    }
  `,
]);

export const SlotCount = tw.span`absolute bottom-[2px] right-[4px] text-[10px] font-bold text-white leading-none tabular-nums`;

// A boost's level, as pips along the top.
export const Pips = tw.span`absolute top-[3px] right-[4px] flex flex-row gap-[2px]`;

export const Pip = styled.span(({ isLit }: { isLit: boolean }) => [
  tw`block w-[3px] h-[3px] rounded-full`,
  css`
    background: ${isLit ? "var(--slot)" : "rgba(255, 255, 255, 0.2)"};
  `,
]);

// A cooldown sweeping round, with the seconds left over it.
export const Cooldown = styled.span(() => [
  tw`absolute inset-0 flex items-center justify-center text-xs font-bold text-white tabular-nums`,
  css`
    background: conic-gradient(rgba(0, 0, 0, 0.7) calc(var(--cool, 0) * 360deg), rgba(0, 0, 0, 0.15) 0);
  `,
]);

// How long a boost that is on has left, along the bottom edge; it moves by transform alone.
export const Left = styled.span(() => [
  tw`absolute left-0 right-0 bottom-0 h-[3px]`,
  css`
    background: var(--slot);
    transform-origin: left center;
    transition: transform 0.25s linear;
  `,
]);

export const Plus = tw.span`flex text-[14px] text-[#3a4566]`;

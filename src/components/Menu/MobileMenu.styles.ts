import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

export const Toggle = styled.button(() => [
  tw`absolute top-[-8px] right-[-8px] z-[11] flex flex-col items-center justify-center gap-[5px] w-[44px] h-[44px] p-0 cursor-pointer
     bg-transparent border-0 lg:hidden`,
  css`
    & > span {
      display: block;
      width: 24px;
      height: 2px;
      background: #ffffff;
      border-radius: 2px;
    }

    & > span:nth-of-type(2) {
      width: 16px;
      align-self: flex-end;
      margin-right: 10px;
      background: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -4px;
    }
  `,
]);

export const rise = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: none; }
`;

export const draw = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

export const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.4); opacity: 0; }
`;

// Full screen, in the top layer, so no transformed or filtered ancestor can clip it. Solid, so nothing of
// the page shows through, with a glow in the colour of the zone the reader is in.
export const Dialog = styled.dialog(() => [
  tw`m-0 p-0 w-screen h-screen max-w-none border-0 text-white`,
  css`
    max-height: none;
    height: 100dvh;
    background: radial-gradient(120% 55% at 50% 0%, rgba(var(--here-rgb), 0.2), transparent 62%), #09090b;

    &::backdrop {
      background: #09090b;
    }

    &[open] {
      display: flex;
    }
  `,
]);

export const Panel = tw.div`flex flex-col w-full max-w-[520px] mx-auto px-[22px] pt-[16px] pb-[28px] overflow-y-auto`;

export const Top = tw.div`flex flex-row items-start justify-between gap-[12px] mb-[22px]`;

export const Heading = tw.div`flex flex-col gap-[4px] pt-[8px]`;

export const Kicker = tw.span`text-xs font-semibold text-[var(--here)]`;

export const Title = tw.h2`m-0 text-2xl font-semibold`;

export const Close = styled.button(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[44px] h-[44px] cursor-pointer text-lg text-white rounded-full`,
  css`
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);

    &:focus-visible {
      outline: 2px solid var(--here);
    }
  `,
]);

// The journey as a route: a line down the left through every stop, each stop a node in its zone's colour.
export const Route = tw.ol`list-none m-0 p-0 flex flex-col`;

export interface StopProps {
  order: number;
  isLast: boolean;
}

export const Stop = styled.li(({ order, isLast }: StopProps) => [
  tw`relative pl-[40px]`,
  css`
    animation: ${rise} 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) ${order * 40}ms both;

    /* The stretch of route to the next stop, fading from this zone's colour into the next one's. */
    &::before {
      content: "";
      display: ${isLast ? "none" : "block"};
      position: absolute;
      left: 14px;
      top: 31px;
      bottom: -31px;
      width: 2px;
      background: linear-gradient(to bottom, var(--zone), var(--next-zone));
      opacity: 0.55;
      transform-origin: top;
      animation: ${draw} 0.3s ease-out ${120 + order * 40}ms both;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;

      &::before {
        animation: none;
      }
    }
  `,
]);

export type StopState = "passed" | "here" | "ahead";

export const Node = styled.span(({ state }: { state: StopState }) => [
  tw`absolute z-[1] rounded-full`,
  state === "here" ? tw`left-[5px] top-[22px] w-[20px] h-[20px]` : tw`left-[8px] top-[25px] w-[14px] h-[14px]`,
  css`
    background: ${state === "ahead" ? "#09090b" : "var(--zone)"};
    border: 2px solid var(--zone);
    box-shadow: ${state === "here" ? "0 0 16px rgba(var(--zone-rgb), 0.8)" : "none"};
  `,
  state === "here" && css`
    &::after {
      content: "";
      position: absolute;
      inset: -2px;
      border-radius: 9999px;
      border: 2px solid var(--zone);
      animation: ${pulse} 1.6s ease-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        animation: none;
      }
    }
  `,
]);

export const StopLink = styled.a(({ state }: { state: StopState }) => [
  tw`relative flex flex-row items-center gap-[12px] min-h-[64px] px-[14px] py-[10px] no-underline text-white rounded-[8px]`,
  css`
    background: ${state === "here" ? "rgba(var(--zone-rgb), 0.12)" : "transparent"};
    transition: background 0.2s ease;

    &:hover,
    &:focus-visible {
      background: rgba(var(--zone-rgb), 0.1);
      outline: none;
    }

    &:focus-visible {
      box-shadow: inset 0 0 0 2px var(--zone);
    }
  `,
]);

export const StopText = tw.span`flex flex-col gap-[3px] flex-1 min-w-0`;

export const StopName = tw.span`flex flex-row items-center gap-[8px] text-xl font-semibold leading-tight`;

export const StopZone = tw.span`text-xs text-[#8f8f8f]`;

// How far through the stop the reader is.
export const Progress = styled.span(() => [
  tw`block h-[2px] mt-[4px] rounded-full bg-[rgba(255, 255, 255, 0.08)] overflow-hidden`,
  css`
    &::after {
      content: "";
      display: block;
      height: 100%;
      width: calc(var(--nav-progress, 0) * 100%);
      background: var(--zone);
    }
  `,
]);

export const Here = tw.span`text-[11px] font-bold text-[#09090b] bg-[var(--zone)] rounded-full px-[7px] py-[2px]`;

export const Chevron = tw.span`text-sm text-[#5a5a5a]`;

export const Actions = tw.div`grid grid-cols-3 gap-[8px] mt-[26px] pt-[20px] border-0 border-t-[1px] border-solid border-[rgba(255, 255, 255, 0.08)]`;

export const Action = styled.a(() => [
  tw`flex flex-col items-center justify-center gap-[6px] h-[64px] text-xs font-semibold no-underline text-white rounded-[8px]`,
  css`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(var(--here-rgb), 0.35);

    & > svg {
      font-size: 16px;
      color: var(--here);
    }

    &:hover,
    &:focus-visible {
      background: rgba(var(--here-rgb), 0.12);
      outline: none;
    }
  `,
]);

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

// The whole screen, edge to edge, over a black backdrop.
export const Dialog = styled.dialog(() => [
  tw`fixed inset-0 m-0 p-0 border-0 text-white overflow-hidden`,
  css`
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    max-width: none;
    max-height: none;
    background: #03050c;

    &::backdrop {
      background: #000000;
    }
  `,
]);

export const Stage = styled.div(() => [
  tw`absolute inset-0 outline-none`,
  css`
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    cursor: crosshair;
  `,
]);

export const Canvas = tw.canvas`absolute inset-0 w-full h-full`;

// How to play, always there for a screen reader, whatever card is showing.
export const ControlsNote = tw.p`sr-only`;

// Static, for legibility over a bright planet; nothing behind it moves the gradient.
export const Hud = styled.header(() => [
  tw`absolute top-0 left-0 right-0 flex flex-row items-start justify-between gap-[12px] p-[14px] md:p-[18px] pointer-events-none`,
  css`
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  `,
]);

export const Place = tw.p`m-0 text-sm md:text-base font-semibold text-[#c4d2ff] tabular-nums`;

export const Readout = tw.dl`m-0 flex flex-row flex-wrap items-center justify-end gap-x-[16px] gap-y-[4px] text-sm tabular-nums`;

export const Reading = tw.div`flex flex-row items-baseline gap-[6px]`;

export const ReadingName = tw.dt`text-xs text-[#9aa3bb]`;

export const ReadingValue = tw.dd`m-0 font-semibold text-white`;

export const Shields = tw.span`flex flex-row gap-[4px] text-[#4fd8ff]`;

export const HudButtons = tw.div`flex flex-row gap-[8px] pointer-events-auto`;

export const IconButton = styled.button(() => [
  tw`flex items-center justify-center w-[38px] h-[38px] p-0 cursor-pointer text-white bg-[rgba(10,14,30,0.75)] border-[1px] border-solid border-[#2a3350] rounded-full`,
  css`
    &:focus-visible {
      outline: 2px solid #c4d2ff;
      outline-offset: 2px;
    }
  `,
]);

const fadeLine = keyframes`
  0% { opacity: 0; transform: translate(-50%, 6px); }
  12% { opacity: 1; transform: translate(-50%, 0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
`;

// Each moment of the voyage, said once and gone. Keyed per message, so a new one plays from the start.
export const Message = styled.p(() => [
  tw`absolute left-1/2 top-[76px] md:top-[84px] m-0 px-[14px] py-[8px] text-sm md:text-base font-semibold text-center text-white pointer-events-none`,
  css`
    max-width: min(90vw, 520px);
    background: rgba(5, 8, 18, 0.72);
    border: 1px solid rgba(196, 210, 255, 0.35);
    animation: ${fadeLine} 2.8s ease both;

    @media (prefers-reduced-motion: reduce) {
      animation-duration: 0.01s;
      animation-delay: 2.6s;
    }
  `,
]);

export const Overlay = tw.div`absolute inset-0 flex items-center justify-center p-[16px] pointer-events-none`;

export const Card = styled.section(() => [
  tw`flex flex-col gap-[12px] w-full max-w-[460px] p-[22px] md:p-[28px] pointer-events-auto`,
  css`
    background: rgba(5, 8, 18, 0.86);
    border: 1px solid rgba(196, 210, 255, 0.4);
  `,
]);

export const Title = tw.h2`m-0 text-2xl md:text-3xl font-semibold text-white`;

export const Text = tw.p`m-0 text-sm md:text-base text-[#c9cfdf] leading-relaxed`;

export const Score = tw.p`m-0 text-3xl font-bold text-[#c4d2ff] tabular-nums`;

export const Badge = tw.p`m-0 self-start px-[10px] py-[4px] text-xs font-semibold text-[#101010] bg-[#ffc45c]`;

export const Buttons = tw.div`flex flex-row flex-wrap gap-[10px] mt-[6px]`;

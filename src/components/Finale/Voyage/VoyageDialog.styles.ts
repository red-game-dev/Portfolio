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

// The GPU lens between the two 2D canvases; hidden until a black hole is on screen.
export const LensCanvas = styled.canvas(() => [
  tw`absolute inset-0 w-full h-full`,
  css`
    visibility: hidden;
  `,
]);

// How to play, always there for a screen reader, whatever card is showing.
export const ControlsNote = tw.p`sr-only`;

// Static, for legibility over a bright planet; nothing behind it moves the gradient.
export const Hud = styled.header(() => [
  tw`absolute top-0 left-0 right-0 flex flex-row items-start justify-between gap-[12px] p-[14px] md:p-[18px] pointer-events-none`,
  css`
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));

    /* Hidden in photo mode, which the flex display would otherwise override. */
    &[hidden] {
      display: none;
    }
  `,
]);

export const Vitals = tw.div`flex flex-col gap-[6px] min-w-0`;

export const Place = tw.p`m-0 text-sm md:text-base font-semibold text-[#c4d2ff] tabular-nums`;

export const Bars = tw.dl`m-0 flex flex-col gap-[4px] w-[150px] md:w-[210px]`;

export const BarRow = styled.div(() => [
  tw`grid items-center gap-x-[8px] gap-y-[2px] text-xs tabular-nums`,
  css`
    grid-template-columns: 1fr auto;
  `,
]);

export const BarLabel = tw.dt`text-[#9aa3bb]`;

export const BarValue = tw.dd`m-0 text-right text-white`;

export const BarTrack = styled.div(() => [
  tw`relative h-[6px] overflow-hidden bg-[rgba(255,255,255,0.12)]`,
  css`
    grid-column: 1 / -1;
  `,
]);

// The fill moves by transform alone, so updating it costs no layout.
export const BarFill = styled.div(({ colour }: { colour: string }) => [
  tw`absolute inset-0`,
  css`
    background: ${colour};
    transform-origin: left center;
    transition: transform 0.25s linear;
  `,
]);

export const TelemetryPanel = styled.section(() => [
  tw`absolute right-[10px] bottom-[10px] md:right-[18px] md:bottom-[18px] p-[8px] md:p-[12px] pointer-events-none`,
  css`
    min-width: 170px;
    max-width: min(66vw, 300px);
    background: rgba(5, 8, 18, 0.72);
    border: 1px solid rgba(196, 210, 255, 0.25);

    @media (min-width: 768px) {
      min-width: 200px;
    }
  `,
]);

export const TelemetryTitle = tw.h2`m-0 mb-[4px] md:mb-[6px] text-[11px] md:text-xs font-semibold text-[#c4d2ff]`;

export const TelemetryList = tw.dl`m-0 flex flex-col gap-[2px] md:gap-[3px] text-[11px] md:text-xs tabular-nums`;

// Only the key readings on narrow screens; every reading where there is room.
export const TelemetryRow = styled.div(({ isKey }: { isKey: boolean }) => [
  tw`flex flex-row items-baseline justify-between gap-[10px] md:gap-[14px]`,
  !isKey && tw`hidden md:flex`,
]);

export const TelemetryName = tw.dt`text-[#9aa3bb]`;

export const TelemetryValue = tw.dd`m-0 text-right text-white`;

// On a phone, a row of its own under the buttons, so the place and the bars keep their room; between them where
// there is space.
export const Readout = tw.dl`m-0 absolute right-[14px] top-[60px] flex flex-row flex-wrap items-center justify-end gap-x-[12px] gap-y-[2px]
  md:static md:gap-x-[16px] md:gap-y-[4px] text-sm tabular-nums pointer-events-none`;

export const Reading = tw.div`flex flex-row items-baseline gap-[6px]`;

export const ReadingName = tw.dt`text-xs text-[#9aa3bb]`;

export const ReadingValue = tw.dd`m-0 font-semibold text-white`;

export const HudButtons = tw.div`flex flex-row gap-[8px] pointer-events-auto`;

// The ship's systems, listed only once one of them is hurt, each with a small bar.
export const Systems = tw.dl`m-0 mt-[4px] flex flex-col gap-[3px] w-[150px] md:w-[210px]`;

export const SystemsTitle = tw.p`m-0 mt-[6px] text-[11px] md:text-xs font-semibold text-[#c4d2ff]`;

export const SystemRow = styled.div(() => [
  tw`grid items-center gap-x-[8px] text-[11px] tabular-nums`,
  css`
    grid-template-columns: 1fr 48px;
  `,
]);

export const SystemName = tw.dt`text-[#9aa3bb] truncate`;

export const SystemTrack = tw.dd`relative m-0 h-[4px] overflow-hidden bg-[rgba(255,255,255,0.12)]`;

export const Credits = tw.p`m-0 text-[11px] text-[#7d859c] leading-snug`;

// MMO frames: the target under the vitals; the boss and any rock headed for a world centred under the HUD on
// narrow screens and along the bottom where there is room.
export const TargetFrame = styled.section(() => [
  tw`mt-[6px] flex flex-col gap-[3px] w-[150px] md:w-[210px] p-[6px] bg-[rgba(5,8,18,0.7)]`,
  css`
    border: 1px solid rgba(255, 77, 94, 0.45);
  `,
]);

export const FrameName = tw.p`m-0 flex flex-row items-baseline justify-between gap-[6px] text-[11px] md:text-xs font-semibold text-white truncate`;

export const FrameMeta = tw.span`text-[10px] md:text-[11px] font-normal text-[#9aa3bb] whitespace-nowrap`;

export const FrameTrack = tw.div`relative h-[5px] overflow-hidden bg-[rgba(255,255,255,0.12)]`;

export const Frames = styled.div(() => [
  tw`absolute left-1/2 top-[150px] md:top-auto md:bottom-[18px] flex flex-col gap-[6px] pointer-events-none`,
  css`
    width: min(88vw, 420px);
    transform: translateX(-50%);
  `,
]);

export const BossFrame = styled.section(() => [
  tw`flex flex-col gap-[4px] p-[8px] bg-[rgba(5,8,18,0.78)]`,
  css`
    border: 1px solid rgba(255, 77, 94, 0.7);
  `,
]);

export const Incoming = styled.section(() => [
  tw`flex flex-col gap-[4px] p-[6px] text-[11px] md:text-xs font-semibold text-[#ffd0d4] bg-[rgba(40,6,10,0.75)]`,
  css`
    border: 1px solid rgba(255, 77, 94, 0.6);
  `,
]);

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
  tw`absolute left-1/2 top-[96px] md:top-[84px] m-0 px-[14px] py-[8px] text-sm md:text-base font-semibold text-center text-white pointer-events-none`,
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

// Never taller than the screen: on a short phone it scrolls within itself rather than being cut off.
export const Card = styled.section(() => [
  tw`flex flex-col gap-[12px] w-full max-w-[460px] p-[22px] md:p-[28px] pointer-events-auto`,
  css`
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: rgba(5, 8, 18, 0.86);
    border: 1px solid rgba(196, 210, 255, 0.4);
  `,
]);

export const Title = tw.h2`m-0 text-2xl md:text-3xl font-semibold text-white`;

export const Text = tw.p`m-0 text-sm md:text-base text-[#c9cfdf] leading-relaxed`;

export const Score = tw.p`m-0 text-3xl font-bold text-[#c4d2ff] tabular-nums`;

export const Badge = tw.p`m-0 self-start px-[10px] py-[4px] text-xs font-semibold text-[#101010] bg-[#ffc45c]`;

export const Buttons = tw.div`flex flex-row flex-wrap gap-[10px] mt-[6px]`;

// The ship's hull and mark, under where it is.
export const ShipLine = tw.p`m-0 text-[11px] md:text-xs text-[#9aa3bb]`;

// Red Coin gold, Void Shards violet.
export const Coin = styled.dd(({ isShards = false }: { isShards?: boolean }) => [
  tw`m-0 font-semibold`,
  isShards ? tw`text-[#c58bff]` : tw`text-[#ffd76a]`,
]);

// Faults on board, each with its fix; the buttons take clicks through the HUD.
export const FaultList = tw.ul`m-0 mt-[4px] p-0 list-none flex flex-col gap-[4px] w-[170px] md:w-[230px] pointer-events-auto`;

export const FaultRow = styled.li(() => [
  tw`flex flex-row flex-wrap items-center justify-between gap-x-[8px] gap-y-[3px] px-[6px] py-[4px] text-[11px] md:text-xs font-semibold text-[#ffd0d4]`,
  css`
    background: rgba(40, 6, 10, 0.7);
    border: 1px solid rgba(255, 77, 94, 0.5);
  `,
]);

// Gold when the hold can fix it; quiet when it cannot, though a tap still says what to look for.
export const FixButton = styled.button(({ isReady }: { isReady: boolean }) => [
  tw`px-[8px] py-[3px] text-[11px] font-semibold cursor-pointer border-0`,
  isReady ? tw`text-[#101010] bg-[#ffd76a]` : tw`text-[#c9cfdf] bg-transparent`,
  css`
    border: ${isReady ? "0" : "1px solid #3a4566"};

    &:focus-visible {
      outline: 2px solid #c4d2ff;
      outline-offset: 2px;
    }
  `,
]);

// What a fault needs, under it, when the hold has nothing that fixes it.
export const FaultNeed = tw.p`m-0 w-full text-[10px] md:text-[11px] font-normal leading-snug text-[#e3b5bb]`;

// The one thing ready to do, in one click.
export const ReadyButton = styled.button(() => [
  tw`flex flex-row items-center justify-center gap-[8px] px-[12px] py-[8px] text-xs md:text-sm font-semibold cursor-pointer text-[#101010] bg-[#7dffcf] border-0
     pointer-events-auto`,
  css`
    box-shadow: 0 0 0 1px rgba(125, 255, 207, 0.4), 0 0 18px rgba(125, 255, 207, 0.35);

    &:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
  `,
]);

export const Salvage = styled.section(() => [
  tw`flex flex-col gap-[4px] p-[6px] text-[11px] md:text-xs font-semibold text-[#c9fff0] bg-[rgba(4,26,22,0.75)]`,
  css`
    border: 1px solid rgba(125, 255, 207, 0.5);
  `,
]);

export const Pay = tw.p`m-0 text-sm md:text-base font-semibold text-[#ffd76a] tabular-nums`;

// Photo mode's only controls, along the bottom: how to look round, save, and go back to flying.
export const PhotoBar = styled.section(() => [
  tw`absolute left-1/2 bottom-[16px] flex flex-row flex-wrap items-center justify-center gap-[10px] px-[14px] py-[10px]`,
  css`
    width: min(92vw, 560px);
    transform: translateX(-50%);
    background: rgba(5, 8, 18, 0.82);
    border: 1px solid rgba(196, 210, 255, 0.35);
  `,
]);

export const PhotoHint = tw.p`m-0 w-full text-center text-xs md:text-sm text-[#c9cfdf]`;

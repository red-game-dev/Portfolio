import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import {
  BLOCK_GRID, isPaymentEffect, isThemeEffect, PAYMENT_SWITCH_MS, PIXEL_GRID, SWITCH_MS, SwitchEffect, THEME_SWITCH_MS, ThemeEffect, ZoneEffect,
} from "@/components/SwitchStage/config";
import { media } from "@/styles/mixins";

const wipeIn = keyframes`
  0% { opacity: 0; clip-path: inset(0 var(--from-right) 0 var(--from-left)); filter: blur(6px) saturate(1.6); transform: scale(0.99); }
  55% { opacity: 1; filter: blur(0) saturate(1.2); }
  100% { opacity: 1; clip-path: inset(0 0 0 0); filter: none; transform: none; }
`;

const beam = keyframes`
  0% { transform: translateX(var(--beam-from)); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { transform: translateX(var(--beam-to)); opacity: 0; }
`;

const settle = keyframes`
  from { opacity: 0.2; }
  to { opacity: 1; }
`;

const blockConfirm = keyframes`
  0% { opacity: 1; transform: scale(1); }
  45% { opacity: 1; transform: scale(1); border-color: var(--accent); box-shadow: inset 0 0 12px rgba(var(--accent-rgb), 0.5); }
  100% { opacity: 0; transform: scale(0.55); }
`;

const dealIn = keyframes`
  0% { opacity: 0; transform: perspective(1600px) translateX(-60px) rotateY(-78deg) scale(0.94); filter: brightness(1.7); }
  55% { opacity: 1; filter: brightness(1.2); }
  100% { opacity: 1; transform: none; filter: none; }
`;

const neonEdge = keyframes`
  0% { box-shadow: 0 0 0 rgba(var(--accent-rgb), 0); }
  50% { box-shadow: 0 0 34px rgba(var(--accent-rgb), 0.55); }
  100% { box-shadow: 0 0 0 rgba(var(--accent-rgb), 0); }
`;

const pixelOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scanIn = keyframes`
  0% { clip-path: inset(0 0 100% 0); filter: brightness(1.6); }
  100% { clip-path: inset(0 0 0 0); filter: none; }
`;

const warpIn = keyframes`
  0% { opacity: 0; transform: scale(0.94); filter: blur(4px) brightness(1.8); }
  60% { opacity: 1; filter: blur(0) brightness(1.15); }
  100% { opacity: 1; transform: none; filter: none; }
`;

// Under a payment's story the new content waits dimmed, then comes up as the payment is approved.
const paySettle = keyframes`
  0%, 45% { opacity: 0.14; }
  100% { opacity: 1; }
`;

// What I have built: the new content comes up from a blueprint's pale lines into its own colours.
const draftIn = keyframes`
  0% { opacity: 0; filter: saturate(0) brightness(1.5); }
  55% { opacity: 0.9; filter: saturate(0.4) brightness(1.15); }
  100% { opacity: 1; filter: none; }
`;

// The drafting grid laid over it, fading as the content takes over.
const gridIn = keyframes`
  0% { opacity: 0; transform: scale(1.03); }
  25% { opacity: 1; }
  70% { opacity: 0.6; }
  100% { opacity: 0; transform: scale(1); }
`;

// The frame traced round the new content from its top left corner, like a plotter's pen.
const traceIn = keyframes`
  0% { clip-path: inset(0 100% 100% 0); opacity: 1; }
  55% { clip-path: inset(0 0 0 0); opacity: 1; }
  100% { clip-path: inset(0 0 0 0); opacity: 0; }
`;

// The pipeline's progress filling, and each stage lighting as it is reached.
const pipelineFill = keyframes`
  0% { transform: scaleX(0); }
  80%, 100% { transform: scaleX(1); }
`;

const stageLit = keyframes`
  0% { background: #0d0d0d; transform: scale(1); }
  40% { background: var(--accent); transform: scale(1.3); }
  100% { background: var(--accent); transform: scale(1); }
`;

const trackOut = keyframes`
  0%, 82% { opacity: 1; }
  100% { opacity: 0; }
`;

// A 2px line, so moving it by top costs nothing worth measuring.
const scanLine = keyframes`
  0% { top: 0; opacity: 1; }
  100% { top: calc(100% - 2px); opacity: 0.2; }
`;

// What a switch animates: every child of the stage except the effect layers. A child that was hidden and
// is now shown restarts its animation, so tabs and carousels that keep every panel in the page need no
// remount; a showcase that mounts only the open panel gets the same effect by keying it.
const CONTENT = "& > :not([data-switch-fx])";

export const Stage = styled.div(({ effect }: { effect: SwitchEffect | null }) => [
  tw`relative`,
  effect === "beam" && css`
    ${CONTENT} {
      animation: ${wipeIn} ${SWITCH_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
  `,
  (effect === "blocks" || effect === "pixels") && css`
    ${CONTENT} {
      animation: ${settle} ${SWITCH_MS}ms ease-out both;
    }
  `,
  effect === "deal" && css`
    ${CONTENT} {
      transform-origin: left center;
      animation: ${dealIn} ${SWITCH_MS}ms cubic-bezier(0.2, 0.8, 0.25, 1) both, ${neonEdge} ${SWITCH_MS + 300}ms ease-out both;
    }
  `,
  effect === "scan" && css`
    ${CONTENT} {
      animation: ${scanIn} ${SWITCH_MS}ms steps(14, end) both;
    }
  `,
  effect === "warp" && css`
    ${CONTENT} {
      animation: ${warpIn} ${SWITCH_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `,
  effect && isPaymentEffect(effect) && css`
    ${CONTENT} {
      animation: ${paySettle} ${PAYMENT_SWITCH_MS}ms ease-out both;
    }
  `,
  effect === "draft" && css`
    ${CONTENT} {
      animation: ${draftIn} ${THEME_SWITCH_MS}ms ease-out both;
    }
  `,
  effect === "pipeline" && css`
    ${CONTENT} {
      animation: ${settle} ${THEME_SWITCH_MS}ms ease-out both;
    }
  `,
  css`
    ${media.reducedMotion} {
      ${CONTENT} {
        animation: none !important;
      }

      & > [data-switch-fx] {
        display: none;
      }
    }
  `,
]);

// The line that crosses the new content: a neural beam left to right for AI, a terminal refresh line top
// to bottom for engineering. Keyed per switch by the caller, so it plays every time.
const Line = styled.span(({ effect }: { effect: "beam" | "scan" }) => [
  tw`absolute z-[3] pointer-events-none bg-[var(--accent)]`,
  effect === "beam" && css`
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    box-shadow: 0 0 18px 4px rgba(var(--accent-rgb), 0.55), 0 0 60px 12px rgba(var(--accent-rgb), 0.2);
    animation: ${beam} ${SWITCH_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  `,
  effect === "scan" && css`
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    box-shadow: 0 0 16px 3px rgba(var(--accent-rgb), 0.6);
    animation: ${scanLine} ${SWITCH_MS}ms steps(14, end) both;
  `,
]);

// A grid of cells over the new content that clears on its own: blocks confirming in a wave for Web3,
// pixels dissolving in a scattered order for the game world.
const Overlay = styled.div(({ columns, rows }: { columns: number; rows: number }) => [
  tw`absolute inset-0 z-[3] grid pointer-events-none`,
  css`
    grid-template-columns: repeat(${columns}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
  `,
]);

const Block = styled.span(({ delay }: { delay: number }) => [
  tw`block m-[2px] bg-[#0d0d0d] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    animation: ${blockConfirm} 420ms ease-in ${delay}ms both;
  `,
]);

const Pixel = styled.span(({ delay, isLit }: { delay: number; isLit: boolean }) => [
  tw`block`,
  isLit ? tw`bg-[var(--accent-muted)]` : tw`bg-[#0d0d0d]`,
  css`
    animation: ${pixelOut} 160ms steps(2, end) ${delay}ms both;
  `,
]);

// What I have built: a drafting grid in the accent, and a dashed frame traced round the content.
const Grid = styled.div(() => [
  tw`absolute inset-0 z-[3] pointer-events-none`,
  css`
    background-image: linear-gradient(rgba(var(--accent-rgb), 0.28) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--accent-rgb), 0.28) 1px, transparent 1px);
    background-size: 22px 22px;
    animation: ${gridIn} ${THEME_SWITCH_MS}ms ease-out both;
  `,
]);

const Trace = styled.div(() => [
  tw`absolute inset-[6px] z-[3] pointer-events-none border-[1px] border-dashed border-[var(--accent)]`,
  css`
    animation: ${traceIn} ${THEME_SWITCH_MS}ms ease-in-out both;
  `,
]);

// The skills by area: a delivery pipeline across the top, its stages lighting in turn (build, test, deploy,
// observe) as the progress fills.
const PIPELINE_STAGES = 4;

const Track = styled.div(() => [
  tw`absolute z-[3] top-[10px] left-[14px] right-[14px] h-[12px] pointer-events-none`,
  css`
    animation: ${trackOut} ${THEME_SWITCH_MS}ms linear both;
  `,
]);

const TrackLine = tw.span`absolute left-0 right-0 top-[5px] h-[2px] bg-[var(--accent-muted)]`;

const TrackFill = styled.span(() => [
  tw`absolute left-0 right-0 top-[5px] h-[2px] bg-[var(--accent)] origin-left`,
  css`
    animation: ${pipelineFill} ${THEME_SWITCH_MS}ms ease-in-out both;
  `,
]);

const PipelineStage = styled.span(({ index }: { index: number }) => [
  tw`absolute top-0 w-[12px] h-[12px] rounded-full border-[2px] border-solid border-[var(--accent)]`,
  css`
    left: ${(index / (PIPELINE_STAGES - 1)) * 100}%;
    margin-left: -6px;
    background: #0d0d0d;
    animation: ${stageLit} ${THEME_SWITCH_MS * 0.3}ms ease-out ${(index / (PIPELINE_STAGES - 1)) * THEME_SWITCH_MS * 0.8}ms both;
  `,
]);

// The layer a theme's switch draws over the content.
const ThemeLayer: FC<{ effect: ThemeEffect }> = ({ effect }) => {
  if (effect === "draft") {
    return (
      <>
        <Grid data-switch-fx aria-hidden="true" />
        <Trace data-switch-fx aria-hidden="true" />
      </>
    );
  }

  return (
    <Track data-switch-fx aria-hidden="true">
      <TrackLine />
      <TrackFill />
      {Array.from({ length: PIPELINE_STAGES }, (_, index) => <PipelineStage key={index} index={index} />)}
    </Track>
  );
};

// The layer an effect draws over the content, if it has one.
export const SwitchLayer: FC<{ effect: ZoneEffect | ThemeEffect }> = ({ effect }) => {
  if (isThemeEffect(effect)) {
    return <ThemeLayer effect={effect} />;
  }

  if (effect === "beam" || effect === "scan") {
    return <Line effect={effect} data-switch-fx aria-hidden="true" />;
  }

  if (effect === "blocks") {
    const { columns, rows } = BLOCK_GRID;

    return (
      <Overlay columns={columns} rows={rows} data-switch-fx aria-hidden="true">
        {Array.from({ length: columns * rows }, (_, index) => (
          <Block key={index} delay={((index % columns) + Math.floor(index / columns)) * 40} />
        ))}
      </Overlay>
    );
  }

  if (effect === "pixels") {
    const { columns, rows } = PIXEL_GRID;
    const count = columns * rows;

    // A fixed scatter, the same on every switch: stepping through the cells by a stride coprime with the count.
    return (
      <Overlay columns={columns} rows={rows} data-switch-fx aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <Pixel key={index} delay={((index * 37) % count) * 4} isLit={index % 5 === 0} />
        ))}
      </Overlay>
    );
  }

  return null;
};

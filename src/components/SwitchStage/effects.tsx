import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { BLOCK_GRID, PIXEL_GRID, SWITCH_MS, SwitchEffect } from "@/components/SwitchStage/config";
import { fadeIn } from "@/styles/keyframes";

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
  effect === "fade" && css`
    ${CONTENT} {
      animation: ${fadeIn} 0.3s ease both;
    }
  `,
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
  css`
    @media (prefers-reduced-motion: reduce) {
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

// The layer an effect draws over the content, if it has one.
export const SwitchLayer: FC<{ effect: SwitchEffect }> = ({ effect }) => {
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

import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { BLOCK_GRID, PIXEL_GRID, SWITCH_MS } from "@/components/Blueprint/config";
import { ZoneId } from "@/config/zones";

// Each universe switches tabs its own way. AI: a neural beam scans the new drawing in. Web3: blocks
// confirm one after another in a diagonal wave. Casino: the drawing is dealt and flipped like a card.
// Game world: a retro pixel dissolve. Engineering: a terminal refreshes top to bottom. The quick view just
// fades; reduced motion just swaps.
export type SwitchEffect = "beam" | "blocks" | "deal" | "pixels" | "scan" | "fade";

export const ZONE_EFFECTS: Record<ZoneId, SwitchEffect> = {
  ai: "beam",
  chain: "blocks",
  casino: "deal",
  mmo: "pixels",
  matrix: "scan",
};

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

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

export const Stage = styled.div(({ effect }: { effect: SwitchEffect | null }) => [
  tw`relative`,
  effect === "fade" && css`
    & > figure {
      animation: ${fade} 0.3s ease both;
    }
  `,
  effect === "beam" && css`
    & > figure {
      animation: ${wipeIn} ${SWITCH_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 3px;
      pointer-events: none;
      background: var(--accent);
      box-shadow: 0 0 18px 4px rgba(var(--accent-rgb), 0.55), 0 0 60px 12px rgba(var(--accent-rgb), 0.2);
      animation: ${beam} ${SWITCH_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
  `,
  (effect === "blocks" || effect === "pixels") && css`
    & > figure {
      animation: ${settle} ${SWITCH_MS}ms ease-out both;
    }
  `,
  effect === "deal" && css`
    & > figure {
      transform-origin: left center;
      animation: ${dealIn} ${SWITCH_MS}ms cubic-bezier(0.2, 0.8, 0.25, 1) both, ${neonEdge} ${SWITCH_MS + 300}ms ease-out both;
    }
  `,
  effect === "scan" && css`
    & > figure {
      animation: ${scanIn} ${SWITCH_MS}ms steps(14, end) both;
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 2px;
      pointer-events: none;
      background: var(--accent);
      box-shadow: 0 0 16px 3px rgba(var(--accent-rgb), 0.6);
      animation: ${scanLine} ${SWITCH_MS}ms steps(14, end) both;
    }
  `,
  css`
    @media (prefers-reduced-motion: reduce) {
      & > figure,
      &::after {
        animation: none !important;
      }

      &::after,
      & > [data-switch-overlay] {
        display: none;
      }
    }
  `,
]);

// A grid of cells over the new drawing that clears on its own: blocks confirming in a wave for Web3,
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

export const SwitchOverlay: FC<{ effect: SwitchEffect }> = ({ effect }) => {
  if (effect === "blocks") {
    const { columns, rows } = BLOCK_GRID;

    return (
      <Overlay columns={columns} rows={rows} data-switch-overlay aria-hidden="true">
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
      <Overlay columns={columns} rows={rows} data-switch-overlay aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <Pixel key={index} delay={((index * 37) % count) * 4} isLit={index % 5 === 0} />
        ))}
      </Overlay>
    );
  }

  return null;
};

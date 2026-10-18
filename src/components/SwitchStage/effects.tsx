import { FC } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import {
  BLOCK_GRID, isPaymentEffect, isThemeEffect, PAYMENT_SWITCH_MS, PIXEL_GRID, SWITCH_MS, SwitchEffect, ThemeEffect, ZoneEffect,
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

// More Skills by Area: each area's skills switch in the way of the universe it belongs to. Each item carries its
// place as --i, its scattered place as --s, how far across the panel it stands as --x (0 to 1), and the way back to
// the tab picked as --from-x and --from-y (the section measures them as it switches).

// The chain: each skill is mined as a block, the block confirming, then giving way to the skill, a link lighting to
// the one before.
const blockMined = keyframes`
  0% { opacity: 1; transform: scale(1); border-color: var(--accent-muted); }
  42% { opacity: 1; transform: scale(1.05); border-color: var(--accent); }
  100% { opacity: 0; transform: scale(0.6); border-color: var(--accent); }
`;

const linkLit = keyframes`
  0%, 30% { opacity: 0; transform: scaleX(0); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0.35; transform: scaleX(1); }
`;

const chipRevealed = keyframes`
  0%, 38% { opacity: 0.08; }
  100% { opacity: 1; }
`;

// The casino: dealt face down from the tab, turning over as it lands.
const cardDealt = keyframes`
  0% { opacity: 0; transform: perspective(700px) translate(var(--from-x, 0px), var(--from-y, 0px)) rotate(-14deg) rotateY(180deg) scale(0.45); }
  14% { opacity: 1; }
  56% { transform: perspective(700px) translate(0, 0) rotate(0) rotateY(90deg) scale(1.03); }
  100% { opacity: 1; transform: none; }
`;

const cardBack = keyframes`
  0%, 55% { opacity: 1; }
  57%, 100% { opacity: 0; }
`;

const cardEdge = keyframes`
  0%, 56% { opacity: 0; }
  70% { opacity: 1; }
  100% { opacity: 0; }
`;

// The game world: popped in by whole sizes, as an 8-bit sprite grows, its pixels clearing.
const pixelPopped = keyframes`
  0% { opacity: 0; transform: scale(0.25); }
  25% { opacity: 1; transform: scale(0.5); }
  50% { transform: scale(0.8); }
  75% { transform: scale(1.12); }
  100% { opacity: 1; transform: none; }
`;

const pixelsCleared = keyframes`
  0%, 60% { opacity: 1; }
  80% { opacity: 0.5; }
  100% { opacity: 0; }
`;

// AI: lit as the neural beam crosses it, from a blur of light into focus, a spark where the beam touched it.
const beamLit = keyframes`
  0% { opacity: 0; filter: blur(5px) brightness(2.2); transform: translateX(-8px); }
  35% { opacity: 1; filter: blur(0) brightness(1.7); }
  100% { opacity: 1; filter: none; transform: none; }
`;

const beamSpark = keyframes`
  0% { opacity: 0; transform: scale(0.4); }
  25% { opacity: 1; transform: scale(1.4); }
  100% { opacity: 0; transform: scale(0.8); }
`;

// Payments: printed line by line out of a till's slot, fed down in the printer's steps, the paper's white flashing.
const printedOut = keyframes`
  0% { opacity: 0; transform: translateY(-16px); clip-path: inset(0 0 100% 0); }
  20% { opacity: 1; }
  100% { opacity: 1; transform: none; clip-path: inset(0 0 0 0); }
`;

const paperFlash = keyframes`
  0% { opacity: 0.55; }
  100% { opacity: 0; }
`;

const slotFed = keyframes`
  0% { opacity: 0; transform: scaleX(0.4); }
  12% { opacity: 1; transform: scaleX(1); }
  80% { opacity: 1; }
  100% { opacity: 0; }
`;

// The engineering terminal: typed out behind a block cursor.
const typedOut = keyframes`
  0% { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
`;

const cursorRan = keyframes`
  0% { left: -0.5em; opacity: 1; }
  80% { left: calc(100% - 0.5em); opacity: 1; }
  90% { opacity: 0; }
  100% { left: calc(100% - 0.5em); opacity: 0; }
`;

// Beyond: dropped out of warp, stretched along the way it came and bright, settling, a streak of light left behind.
const warpedIn = keyframes`
  0% { opacity: 0; transform: translateX(calc(var(--warp-from, 1) * 46px)) scaleX(1.9); filter: blur(3px) brightness(2.2); }
  55% { opacity: 1; transform: translateX(0) scaleX(0.96); filter: blur(0) brightness(1.3); }
  100% { opacity: 1; transform: none; filter: none; }
`;

const warpStreak = keyframes`
  0% { opacity: 0.9; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0); }
`;

// More Skills by Area's drawings: a live system booting, each box flickering on like a strip light before it holds,
// a glow as it comes up, the wires powering on after the boxes.
const bootedOn = keyframes`
  0% { opacity: 0.05; filter: saturate(0); }
  8% { opacity: 0.7; }
  12% { opacity: 0.12; }
  20% { opacity: 0.9; }
  25% { opacity: 0.3; }
  36% { opacity: 1; filter: none; }
  100% { opacity: 1; }
`;

const bootGlow = keyframes`
  0%, 30% { opacity: 0; }
  42% { opacity: 1; }
  100% { opacity: 0; }
`;

const wiresPowered = keyframes`
  0%, 45% { opacity: 0.08; }
  55% { opacity: 0.8; }
  60% { opacity: 0.25; }
  75%, 100% { opacity: 1; }
`;

// What I have built: each tile is drafted in turn, a pen tracing its frame from the top left corner over a drafting
// grid, the tile coming up from a blueprint's pale lines into its own colours.
const tileDrafted = keyframes`
  0% { opacity: 0.15; filter: saturate(0) brightness(1.5); }
  45% { opacity: 0.65; }
  100% { opacity: 1; filter: none; }
`;

const tileTraced = keyframes`
  0% { clip-path: inset(0 100% 100% 0); opacity: 1; }
  32% { clip-path: inset(0 0 100% 0); }
  62% { clip-path: inset(0 0 0 0); opacity: 1; }
  100% { clip-path: inset(0 0 0 0); opacity: 0; }
`;

const penStroke = keyframes`
  0% { transform: scaleX(0); opacity: 1; }
  32% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
`;

// A dimension line measured across the first tile, the way a plan gives its sizes.
const dimensioned = keyframes`
  0%, 18% { opacity: 0; transform: scaleX(0); }
  40% { opacity: 1; transform: scaleX(1); }
  78% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1); }
`;

// How long each item's part of a theme's switch takes, and the step between items (none past `most`).
const DRAFT = { ms: 560, stepMs: 70, most: 11 } as const;

const AREA = {
  mined: { ms: 520, stepMs: 45 },
  dealt: { ms: 560, stepMs: 38 },
  pixel: { ms: 360, stepMs: 28 },
  printed: { ms: 440, stepMs: 55 },
  typed: { ms: 420, stepMs: 60 },
  warped: { ms: 520, stepMs: 26 },
  most: 16,
} as const;

// The beam crosses the panel in this long; each skill lights as it reaches it.
const BEAM = { ms: 440, crossMs: 520 } as const;

const BOOT = { ms: 760, stepMs: 55, most: 14 } as const;

const ITEM = "& > :not([data-switch-fx]) [data-switch-item]";

// A skill rather than an area's heading: only skills are linked into the chain.
const SKILL = `${ITEM}:not(h3)`;

// Each item's start, in order of its place (or its scattered place), none later than the `most`th.
const itemDelay = (stepMs: number, most: number, order = "--i") => `calc(min(var(${order}, 0), ${most}) * ${stepMs}ms)`;

// A layer drawn over an item, under the switch's control.
const OVER = css`
  content: "";
  position: absolute;
  pointer-events: none;
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
  effect === "mined" && css`
    ${ITEM} {
      position: relative;
      animation: ${chipRevealed} ${AREA.mined.ms}ms ease-out both;
      animation-delay: ${itemDelay(AREA.mined.stepMs, AREA.most)};
    }

    ${ITEM}::before {
      ${OVER}
      inset: -1px;
      z-index: 1;
      border-radius: inherit;
      border: 1px solid var(--accent-muted);
      background: #0b0b0b repeating-linear-gradient(90deg, rgba(var(--accent-rgb), 0.16) 0 2px, transparent 2px 7px);
      box-shadow: inset 0 0 12px rgba(var(--accent-rgb), 0.45), 0 0 14px rgba(var(--accent-rgb), 0.4);
      animation: ${blockMined} ${AREA.mined.ms}ms cubic-bezier(0.5, 0, 0.75, 0) both;
      animation-delay: inherit;
    }

    ${SKILL}::after {
      ${OVER}
      top: 50%;
      left: -9px;
      width: 8px;
      height: 2px;
      margin-top: -1px;
      background: var(--accent);
      box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.8);
      transform-origin: right center;
      animation: ${linkLit} ${AREA.mined.ms}ms ease-out both;
      animation-delay: inherit;
    }
  `,
  effect === "dealt" && css`
    ${ITEM} {
      position: relative;
      animation: ${cardDealt} ${AREA.dealt.ms}ms cubic-bezier(0.2, 0.8, 0.25, 1) both;
      animation-delay: ${itemDelay(AREA.dealt.stepMs, AREA.most)};
    }

    ${ITEM}::before {
      ${OVER}
      inset: -1px;
      z-index: 1;
      border-radius: inherit;
      border: 1px solid var(--accent);
      /* A playing card's back: a diamond lattice inside a border. */
      box-shadow: inset 0 0 0 2px #120d06, inset 0 0 0 3px rgba(var(--accent-rgb), 0.7);
      background: #120d06 repeating-linear-gradient(45deg, rgba(var(--accent-rgb), 0.32) 0 1.5px, transparent 1.5px 7px),
        repeating-linear-gradient(-45deg, rgba(var(--accent-rgb), 0.32) 0 1.5px, transparent 1.5px 7px);
      animation: ${cardBack} ${AREA.dealt.ms}ms linear both;
      animation-delay: inherit;
    }

    ${ITEM}::after {
      ${OVER}
      inset: -2px;
      border-radius: inherit;
      box-shadow: 0 0 0 1px var(--accent), 0 0 16px 2px rgba(var(--accent-rgb), 0.6);
      opacity: 0;
      animation: ${cardEdge} ${AREA.dealt.ms}ms ease-out both;
      animation-delay: inherit;
    }
  `,
  effect === "pixel" && css`
    ${ITEM} {
      position: relative;
      animation: ${pixelPopped} ${AREA.pixel.ms}ms steps(1, end) both;
      animation-delay: ${itemDelay(AREA.pixel.stepMs, AREA.most, "--s")};
    }

    ${ITEM}::before {
      ${OVER}
      inset: -1px;
      z-index: 1;
      background-image: conic-gradient(rgba(var(--accent-rgb), 0.95) 25%, #0d0d0d 0 50%, rgba(var(--accent-rgb), 0.95) 0 75%, #0d0d0d 0);
      background-size: 6px 6px;
      animation: ${pixelsCleared} ${AREA.pixel.ms}ms steps(1, end) both;
      animation-delay: inherit;
    }
  `,
  effect === "beamed" && css`
    ${ITEM} {
      position: relative;
      animation: ${beamLit} ${BEAM.ms}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      animation-delay: calc(var(--x, 0) * ${BEAM.crossMs}ms);
    }

    ${ITEM}::after {
      ${OVER}
      top: 50%;
      left: -4px;
      width: 7px;
      height: 7px;
      margin-top: -3.5px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px 3px rgba(var(--accent-rgb), 0.7);
      opacity: 0;
      animation: ${beamSpark} ${BEAM.ms}ms ease-out both;
      animation-delay: inherit;
    }
  `,
  effect === "printed" && css`
    ${ITEM} {
      position: relative;
      animation: ${printedOut} ${AREA.printed.ms}ms steps(7, end) both;
      animation-delay: ${itemDelay(AREA.printed.stepMs, AREA.most)};
    }

    ${ITEM}::after {
      ${OVER}
      inset: -1px;
      border-radius: inherit;
      background: #f2f0ea;
      opacity: 0;
      animation: ${paperFlash} ${AREA.printed.ms}ms ease-out both;
      animation-delay: inherit;
    }
  `,
  effect === "typed" && css`
    ${ITEM} {
      position: relative;
      animation: ${typedOut} ${AREA.typed.ms}ms steps(12, end) both;
      animation-delay: ${itemDelay(AREA.typed.stepMs, AREA.most)};
    }

    ${ITEM}::after {
      ${OVER}
      top: 18%;
      bottom: 18%;
      width: 0.5em;
      background: var(--accent);
      box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.8);
      animation: ${cursorRan} ${AREA.typed.ms}ms steps(12, end) both;
      animation-delay: inherit;
    }
  `,
  effect === "warped" && css`
    ${ITEM} {
      position: relative;
      transform-origin: left center;
      animation: ${warpedIn} ${AREA.warped.ms}ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: ${itemDelay(AREA.warped.stepMs, AREA.most)};
    }

    ${ITEM}::after {
      ${OVER}
      top: 50%;
      left: 100%;
      width: 64px;
      height: 1px;
      margin-top: -0.5px;
      background: linear-gradient(90deg, var(--accent), transparent);
      transform-origin: left center;
      animation: ${warpStreak} ${AREA.warped.ms}ms ease-out both;
      animation-delay: inherit;
    }
  `,
  effect === "boot" && css`
    ${ITEM} {
      position: relative;
      animation: ${bootedOn} ${BOOT.ms}ms linear both;
      animation-delay: ${itemDelay(BOOT.stepMs, BOOT.most)};
    }

    ${ITEM}::after {
      ${OVER}
      inset: -2px;
      border-radius: inherit;
      box-shadow: 0 0 0 1px var(--accent), 0 0 16px 2px rgba(var(--accent-rgb), 0.5);
      opacity: 0;
      animation: ${bootGlow} ${BOOT.ms}ms ease-out both;
      animation-delay: inherit;
    }

    & > :not([data-switch-fx]) .wire {
      animation: ${wiresPowered} ${BOOT.ms + BOOT.most * BOOT.stepMs}ms linear both;
    }
  `,
  effect === "draft" && css`
    ${ITEM} {
      position: relative;
      animation: ${tileDrafted} ${DRAFT.ms}ms ease-out both;
      animation-delay: calc(min(var(--i, 0), ${DRAFT.most}) * ${DRAFT.stepMs}ms);
    }

    ${ITEM}::before {
      content: "";
      position: absolute;
      inset: -1px;
      pointer-events: none;
      border: 1px dashed var(--accent);
      background-image: linear-gradient(rgba(var(--accent-rgb), 0.22) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), 0.22) 1px, transparent 1px);
      background-size: 16px 16px;
      animation: ${tileTraced} ${DRAFT.ms}ms ease-in-out both;
      animation-delay: inherit;
    }

    ${ITEM}::after {
      content: "";
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      height: 2px;
      pointer-events: none;
      transform-origin: left center;
      background: var(--accent);
      box-shadow: 0 0 8px 1px rgba(var(--accent-rgb), 0.8);
      animation: ${penStroke} ${DRAFT.ms}ms ease-in-out both;
      animation-delay: inherit;
    }

    & > :not([data-switch-fx]) [data-switch-dimension] {
      animation: ${dimensioned} ${DRAFT.ms + DRAFT.stepMs * 2}ms ease-out both;
    }
  `,
  css`
    ${media.reducedMotion} {
      ${CONTENT},
      ${ITEM},
      ${ITEM}::before,
      ${ITEM}::after,
      & > :not([data-switch-fx]) .wire,
      & > :not([data-switch-fx]) [data-switch-dimension] {
        animation: none !important;
      }

      & > [data-switch-fx] {
        display: none;
      }
    }
  `,
]);

// The line that crosses the new content: a neural beam left to right for AI (at an even pace for an AI skill
// area, whose skills light as it reaches them), a terminal refresh line top to bottom for engineering, and the
// slot a till's receipt feeds out of for a payments skill area. Keyed per switch by the caller, so it plays every
// time.
const Line = styled.span(({ effect }: { effect: "beam" | "sweep" | "scan" | "slot" }) => [
  tw`absolute z-[3] pointer-events-none bg-[var(--accent)]`,
  effect === "beam" && css`
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    box-shadow: 0 0 18px 4px rgba(var(--accent-rgb), 0.55), 0 0 60px 12px rgba(var(--accent-rgb), 0.2);
    animation: ${beam} ${SWITCH_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  `,
  effect === "sweep" && css`
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    box-shadow: 0 0 18px 4px rgba(var(--accent-rgb), 0.55), 0 0 60px 12px rgba(var(--accent-rgb), 0.2);
    animation: ${beam} ${BEAM.crossMs + BEAM.ms / 2}ms linear both;
  `,
  effect === "slot" && css`
    left: 0;
    right: 0;
    top: -9px;
    height: 3px;
    background: linear-gradient(90deg, transparent, #f2f0ea 12%, #f2f0ea 88%, transparent);
    box-shadow: 0 0 14px 2px rgba(242, 240, 234, 0.35);
    animation: ${slotFed} ${AREA.printed.ms + AREA.most * AREA.printed.stepMs}ms ease-out both;
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
export const SwitchLayer: FC<{ effect: ZoneEffect | ThemeEffect }> = ({ effect }) => {
  // A theme's switch animates the content's own items; an AI area's beam and a payments area's slot lie over them.
  if (effect === "beamed") {
    return <Line effect="sweep" data-switch-fx aria-hidden="true" />;
  }

  if (effect === "printed") {
    return <Line effect="slot" data-switch-fx aria-hidden="true" />;
  }

  if (isThemeEffect(effect)) {
    return null;
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

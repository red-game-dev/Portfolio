import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { ZoneId } from "@/config/zones";
import { BlueprintNode } from "@/types/blueprints";

// The drawing is always laid out side by side, as a diagram. Where there is less room than it needs (a
// phone, a dialog), it is laid out at the width it needs and either scaled down to fit or panned at full
// size. Styles keyed on data-wide are for the frames' placement.
const WIDE = '[data-wide="true"] &';

export interface FlavourProps {
  zone: ZoneId;
}

export const Root = tw.div`flex flex-col gap-[10px]`;

export const Controls = tw.div`flex flex-row flex-wrap items-center justify-between gap-[10px]`;

export const Hint = tw.p`m-0 text-xs text-[#8a8a8a]`;

export const Zoom = styled.button(() => [
  tw`inline-flex flex-row items-center gap-[8px] h-[32px] px-[12px] cursor-pointer text-xs font-semibold text-[var(--accent)] bg-transparent
     rounded-[2px] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    &:hover,
    &:focus-visible {
      border-color: var(--accent);
    }
  `,
]);

// Holds the diagram: scaled to fit, its height follows the scaled drawing; zoomed in, it scrolls sideways.
export const Viewport = styled.div(({ isPanning }: { isPanning: boolean }) => [
  tw`relative w-full`,
  isPanning ? tw`overflow-x-auto overflow-y-hidden pb-[6px]` : tw`overflow-hidden`,
  css`
    scrollbar-width: thin;
  `,
]);

export const signal = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;

export const Diagram = styled.div(() => [
  tw`relative grid grid-cols-1 gap-[26px]`,
  css`
    &[data-wide="true"] {
      grid-template-columns: repeat(var(--bp-cols), minmax(0, 1fr));
      gap: 34px;
    }
  `,
]);

// On a phone the boxes stack and lines would run behind them, so the wires become a short list instead.
// On wide screens the same list stays for screen readers only.
export const WireList = styled.ul(() => [
  tw`list-none m-0 p-0 flex flex-col gap-[6px] text-xs text-[#aaa]`,
  css`
    ${WIDE} {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  `,
]);

export const WireItem = tw.li`break-words`;

export const WireArrow = tw.span`text-[var(--accent)]`;

// Each world draws its frames its own way: a terminal rule, a soft neural glow, a chain block, a neon
// table rim, or a game UI panel with cut corners.
export const groupFlavour = (zone: ZoneId) => {
  switch (zone) {
    case "ai":
      return css`
        border-radius: 12px;
        box-shadow: inset 0 0 24px rgba(var(--accent-rgb), 0.05);
      `;
    case "casino":
      return css`
        border-radius: 14px;
        box-shadow: 0 0 0 1px rgba(var(--accent-rgb), 0.08), inset 0 0 18px rgba(var(--accent-rgb), 0.06);
      `;
    case "mmo":
      return css`
        clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px);
        background: rgba(255, 196, 92, 0.03);
      `;
    default:
      return css``;
  }
};

export const Group = styled.div(({ zone, hasFrame, isExternal }: FlavourProps & { hasFrame: boolean; isExternal: boolean }) => [
  tw`relative flex flex-col min-w-0`,
  hasFrame && tw`p-[12px] border-[1px] border-solid border-[#2a2a2a] bg-[rgba(255, 255, 255, 0.015)]`,
  hasFrame && isExternal && tw`border-dashed border-[#3a3a3a]`,
  hasFrame && groupFlavour(zone),
  css`
    ${WIDE} {
      grid-column: var(--bp-col);
      grid-row: var(--bp-row);
    }
  `,
]);

// In the flow rather than pinned, so a long label wraps instead of being cut off.
export const GroupLabel = tw.span`block mb-[10px] text-[11px] font-semibold leading-snug text-[var(--accent)]`;

export const Nodes = styled.div(() => [
  tw`grid gap-[10px] h-full content-center`,
  css`
    grid-template-columns: repeat(var(--bp-narrow), minmax(0, 1fr));

    ${WIDE} {
      grid-template-columns: repeat(var(--bp-inner), minmax(0, 1fr));
    }
  `,
]);

export const nodeFlavour = (zone: ZoneId) => {
  switch (zone) {
    case "ai":
      return css`
        border-radius: 10px;
        border-color: var(--accent-muted);
        box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.1);
      `;
    case "chain":
      return css`
        padding-top: 22px;
        border-color: var(--accent-muted);

        &::before {
          content: attr(data-hash);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 3px 8px;
          font-size: 9px;
          letter-spacing: 0.04em;
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.08);
          border-bottom: 1px solid var(--accent-muted);
          overflow: hidden;
          white-space: nowrap;
        }
      `;
    case "casino":
      return css`
        border-radius: 8px;
        border-color: var(--accent-muted);
        box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.12), 0 0 12px rgba(var(--accent-rgb), 0.14);
      `;
    case "mmo":
      return css`
        border-color: var(--accent-muted);
        clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
        background: linear-gradient(180deg, #1a150c, #110e08);
      `;
    default:
      return css`
        border-left: 2px solid var(--accent);
      `;
  }
};

export const Node = styled.div(({ zone, kind }: FlavourProps & { kind: BlueprintNode["kind"] }) => [
  tw`relative z-[1] flex flex-col gap-[2px] px-[10px] py-[8px] min-w-0 bg-[#101010] border-[1px] border-solid border-[#2e2e2e]`,
  nodeFlavour(zone),
  kind === "note" && tw`bg-[#0d0d0d] border-dashed`,
  kind === "decision" && css`
    border-style: double;
    border-width: 3px;
  `,
  css`
    grid-column: span var(--bp-span-narrow, 1);

    ${WIDE} {
      grid-column: span var(--bp-span, 1);
    }
  `,
]);

export const NodeLabel = tw.span`flex flex-row items-center gap-[6px] text-xs md:text-sm font-semibold text-white leading-snug break-words`;

export const NodeDetail = tw.span`text-[11px] md:text-xs text-[#9a9a9a] leading-snug break-words`;

export const KindIcon = tw.span`text-[var(--accent)] text-[11px]`;

export const Diamond = tw.span`inline-block w-[7px] h-[7px] rotate-45 bg-[var(--accent)]`;

export const Wires = styled.svg(({ isMoving }: { isMoving: boolean }) => [
  tw`hidden absolute top-0 left-0 z-0 pointer-events-none overflow-visible`,
  css`
    ${WIDE} {
      display: block;
    }

    .wire {
      fill: none;
      stroke: var(--accent-muted);
      stroke-width: 1.5;
    }

    .wire.dashed {
      stroke-dasharray: 5 4;
    }

    .signal {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-dasharray: 2.5 97.5;
      opacity: 0;
    }

    .label {
      font-size: 10px;
      fill: #c8c8c8;
      paint-order: stroke;
      stroke: #0d0d0d;
      stroke-width: 4px;
      stroke-linejoin: round;
    }
  `,
  isMoving && css`
    .signal {
      opacity: 1;
      animation: ${signal} 2.6s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .signal {
        display: none;
      }
    }
  `,
]);

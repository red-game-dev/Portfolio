import tw, { css, styled } from "twin.macro";

import { focusRing, honourHidden, media } from "@/styles/mixins";


// How each rarity is coloured wherever a thing is named.
export const RARITY_COLOUR: Record<"common" | "uncommon" | "rare" | "epic" | "legendary", string> = {
  common: "#aab3c9",
  uncommon: "#6ee7a8",
  rare: "#4fd8ff",
  epic: "#c58bff",
  legendary: "#ffc45c",
};

// The flight deck's palette: the panel, its rules and frames, its ink. Each tab sets "--tab-accent" (and "--accent",
// which the shared focus rings and tabs read) to its own colour.
const RULE = "rgba(196, 210, 255, 0.12)";
const RIM = "rgba(196, 210, 255, 0.28)";
const DIM = "#6d7591";

// A colour softened for a fill behind text; browsers that cannot mix keep the plain tint before it.
const tint = (share: number) => css`
  background: rgba(255, 255, 255, 0.05);
  background: color-mix(in srgb, var(--tab-accent) ${share}%, transparent);
`;

// A drawer along the right on wide screens, the whole screen on a phone, over the voyage, lit along its top edge in
// the open tab's accent.
export const Panel = styled.section(() => [
  tw`absolute top-0 right-0 bottom-0 flex flex-col w-full md:w-[460px] text-white`,
  css`
    --tab-accent: #ffd76a;
    --accent: var(--tab-accent);
    background: #05081a;
    border-left: 1px solid ${RIM};
    box-shadow: inset 0 2px 0 var(--tab-accent);
    z-index: 2;
  `,
]);

export const Header = tw.div`flex flex-row items-center gap-[10px] px-[16px] pt-[14px] pb-[10px]`;

export const Heading = tw.h2`m-0 mr-auto text-lg md:text-xl font-semibold text-white outline-none`;

// The purse: each currency a button that says what it is.
export const Purse = tw.div`flex flex-row items-center gap-[6px]`;

export const PurseButton = styled.button(({ colour, isOpen }: { colour: string; isOpen: boolean }) => [
  tw`inline-flex items-center min-h-[38px] px-[10px] cursor-pointer text-sm font-semibold tabular-nums bg-transparent border-[1px] border-solid`,
  css`
    color: ${colour};
    border-color: ${isOpen ? colour : RULE};
    transition: border-color 0.2s ease;

    &:hover {
      border-color: ${colour};
    }
  `,
  focusRing("#c4d2ff", 2),
]);

export const Shards = tw.span`text-[#c58bff]`;

// The coin there is to spend, where the purse only shows it (a station's trade).
export const PurseText = tw.p`m-0 text-sm font-semibold tabular-nums text-[#ffd76a]`;

// What a currency is, opened from the purse.
export const PurseNote = styled.div(() => [
  tw`flex flex-col gap-[4px] mx-[16px] mb-[10px] px-[12px] py-[10px] text-xs md:text-sm leading-relaxed text-[#c9cfdf]`,
  css`
    background: rgba(255, 255, 255, 0.03);
    border-left: 2px solid var(--tab-accent);
  `,
]);

export const PurseNoteTitle = tw.span`font-semibold text-white`;

// The hangar's one suggestion, a tap away.
export const NextStep = styled.div(() => [
  tw`flex flex-row items-center gap-[10px] px-[16px] py-[8px] text-xs md:text-sm`,
  css`
    background: rgba(255, 215, 106, 0.07);
    border-top: 1px solid rgba(255, 215, 106, 0.18);
    border-bottom: 1px solid rgba(255, 215, 106, 0.18);
  `,
]);

export const NextStepText = tw.span`flex-1 min-w-0 text-[#f4e7c2]`;

export const NextStepLabel = tw.span`block text-[11px] font-semibold text-[#ffd76a]`;

// The six tabs, each an icon over its name, in one row across the drawer that never wraps: where they do not fit (a
// narrow phone, larger text) the row scrolls sideways under a finger, snapping to a tab, and an edge with more past
// it fades. Its rule is drawn inside it, since a row that scrolls clips whatever hangs below it.
export const TabBar = styled.div(({ fadeStart, fadeEnd }: { fadeStart: boolean; fadeEnd: boolean }) => {
  const fade = `linear-gradient(to right, ${fadeStart ? "transparent" : "#000"}, #000 18px, #000 calc(100% - 18px), ${fadeEnd ? "transparent" : "#000"})`;

  return [
    tw`flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden`,
    css`
      box-shadow: inset 0 -1px 0 ${RULE};
      -webkit-mask-image: ${fade};
      mask-image: ${fade};
      scroll-snap-type: x proximity;
      overscroll-behavior-x: contain;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    `,
  ];
});

export const TabButton = styled.button(({ isOn, accent }: { isOn: boolean; accent: string }) => [
  tw`relative flex flex-col items-center justify-center gap-[4px] min-h-[56px] px-[2px] cursor-pointer bg-transparent border-0 text-[11px] md:text-xs
     font-semibold`,
  css`
    flex: 1 0 64px;
    scroll-snap-align: start;
    white-space: nowrap;
    color: ${isOn ? accent : "#9aa3bb"};
    transition: color 0.2s ease;

    & > svg {
      font-size: 16px;
    }

    &::after {
      content: "";
      position: absolute;
      left: 18%;
      right: 18%;
      bottom: 0;
      height: 2px;
      background: ${accent};
      transform: scaleX(${isOn ? 1 : 0});
      transition: transform 0.2s ease;
    }

    &:hover {
      color: ${accent};
    }

    ${media.reducedMotion} {
      transition: none;

      &::after {
        transition: none;
      }
    }
  `,
  focusRing("#c4d2ff", -2),
]);

// Something there can be done now: over a tab's icon, or in a section's corner.
export const Dot = styled.span(({ colour, isCorner = false }: { colour: string; isCorner?: boolean }) => [
  tw`absolute w-[8px] h-[8px] rounded-full pointer-events-none`,
  css`
    top: ${isCorner ? "4px" : "9px"};
    right: ${isCorner ? "4px" : "calc(50% - 16px)"};
    background: ${colour};
    box-shadow: 0 0 0 2px #05081a;
  `,
]);

// The open tab's sections, a row of the site's tabs under the hangar's own.
export const SectionBar = tw.div`px-[16px] pt-[10px]`;

// A sideways swipe across it moves between tabs, so it lets the browser scroll only up and down.
export const Body = styled.div(() => [
  tw`flex-1 min-h-0 overflow-y-auto px-[16px] pt-[14px] pb-[24px]`,
  css`
    scrollbar-width: thin;
    overscroll-behavior: contain;
    touch-action: pan-y;
  `,
]);

export const TabPanel = styled.div(() => [tw`flex flex-col gap-[16px]`, honourHidden]);

export const Subheading = styled.h3(() => [
  tw`m-0 text-sm font-semibold`,
  css`
    color: var(--tab-accent);
  `,
]);

export const Note = tw.p`m-0 text-xs md:text-sm text-[#aab3c9] leading-relaxed`;

export const ShipName = tw.p`m-0 text-xl font-semibold text-white`;

// Each stat with what the next level makes it, where it changes.
export const Stats = styled.dl(() => [
  tw`m-0 grid gap-x-[12px] gap-y-[6px] text-xs md:text-sm tabular-nums`,
  css`
    grid-template-columns: 1fr auto auto;
  `,
]);

// A stat's name, value and next value, laid out by the grid around it.
export const StatRow = tw.div`contents`;

export const StatName = tw.dt`text-[#9aa3bb]`;

export const StatValue = tw.dd`m-0 text-right text-white`;

export const StatNext = tw.dd`m-0 text-right text-[#6ee7a8]`;

// A group of a tab: no box of its own, set off from the one before by a rule.
export const Block = styled.section(() => [
  tw`flex flex-col gap-[10px]`,
  css`
    padding-top: 16px;
    border-top: 1px solid ${RULE};

    &:first-child {
      padding-top: 0;
      border-top: 0;
    }
  `,
]);

// The one framed panel of a tab, for what matters most there: corner brackets in the tab's accent.
export const Frame = styled.section(() => [
  tw`relative flex flex-col gap-[10px] p-[14px]`,
  css`
    --corner: var(--tab-accent);
    background:
      linear-gradient(var(--corner), var(--corner)) left top / 14px 2px,
      linear-gradient(var(--corner), var(--corner)) left top / 2px 14px,
      linear-gradient(var(--corner), var(--corner)) right top / 14px 2px,
      linear-gradient(var(--corner), var(--corner)) right top / 2px 14px,
      linear-gradient(var(--corner), var(--corner)) left bottom / 14px 2px,
      linear-gradient(var(--corner), var(--corner)) left bottom / 2px 14px,
      linear-gradient(var(--corner), var(--corner)) right bottom / 14px 2px,
      linear-gradient(var(--corner), var(--corner)) right bottom / 2px 14px,
      rgba(255, 255, 255, 0.03);
    background-repeat: no-repeat;
    outline: 1px solid ${RULE};
    outline-offset: -1px;
  `,
]);

export const Needs = tw.ul`m-0 p-0 list-none flex flex-col gap-[6px] text-xs md:text-sm tabular-nums`;

export const Need = styled.li(({ isMet }: { isMet: boolean }) => [
  tw`flex flex-row justify-between gap-[10px]`,
  isMet ? tw`text-[#c9cfdf]` : tw`text-[#ff9aa5]`,
]);

// Rows on rules rather than boxes.
export const Items = styled.ul(() => [
  tw`m-0 p-0 list-none flex flex-col`,
  css`
    & > li + li {
      border-top: 1px solid ${RULE};
    }
  `,
]);

export const Item = tw.li`flex flex-col gap-[6px] py-[12px] first:pt-[4px]`;

export const ItemTop = tw.div`flex flex-row items-baseline justify-between gap-[10px]`;

export const ItemName = styled.p(({ colour }: { colour: string }) => [
  tw`m-0 text-sm font-semibold`,
  css`
    color: ${colour};
  `,
]);

export const ItemCount = tw.span`text-xs text-[#9aa3bb] tabular-nums whitespace-nowrap`;

export const Actions = tw.div`flex flex-row flex-wrap gap-[8px] mt-[2px]`;

// Actions inside the drawer: the tab's accent for the one to take, an outline for the rest, and a dashed outline
// with dim words for one that cannot be taken yet, so it never reads as pressed. Tall enough for a thumb on a phone.
export const SmallButton = styled.button(({ isPrimary = false }: { isPrimary?: boolean }) => [
  tw`inline-flex items-center justify-center min-h-[40px] md:min-h-[34px] px-[12px] py-[6px] text-xs font-semibold cursor-pointer border-[1px] border-solid`,
  isPrimary ? tw`text-[#05081a]` : tw`text-white bg-transparent`,
  css`
    background: ${isPrimary ? "var(--tab-accent)" : "transparent"};
    border-color: ${isPrimary ? "var(--tab-accent)" : RIM};
    transition: border-color 0.2s ease;

    &:hover:not(:disabled) {
      border-color: ${isPrimary ? "#ffffff" : "var(--tab-accent)"};
    }

    &:disabled {
      cursor: not-allowed;
      color: ${DIM};
      background: transparent;
      border-color: rgba(196, 210, 255, 0.2);
      border-style: dashed;
    }

    ${focusRing("#c4d2ff", 2)}
  `,
]);

// An enhancement's badges: one icon for each step of its tier, in the tier's colour.
export const BadgeRow = tw.span`flex flex-row flex-wrap gap-[2px]`;

export const Badge = styled.span(({ colour }: { colour: string }) => [
  tw`flex text-[10px]`,
  css`
    color: ${colour};
    filter: drop-shadow(0 0 3px ${colour});
  `,
]);

// What a piece adds or fires, line by line.
export const StatList = tw.ul`m-0 p-0 list-none flex flex-row flex-wrap gap-x-[10px] gap-y-[2px]`;

export const StatLine = tw.li`text-[11px] md:text-xs text-[#c9cfdf] tabular-nums`;

// A colour a paint or a trail is made of.
export const Swatch = styled.span(({ colour }: { colour: string }) => [
  tw`inline-block w-[14px] h-[14px] align-middle`,
  css`
    background: ${colour};
    border: 1px solid rgba(255, 255, 255, 0.25);
  `,
]);

// A gauge in segments, as the HUD's: as many as there are steps to it, up to twenty, or ten for a share. What fills
// it is a `BarFill` inside, scaled; the segments are cut from both by the mask.
export const Meter = styled.div(({ segments = 10 }: { segments?: number }) => {
  const count = Math.max(1, Math.min(20, Math.round(segments)));
  const cut = `repeating-linear-gradient(90deg, #000 0 calc(${100 / count}% - 2px), transparent calc(${100 / count}% - 2px) ${100 / count}%)`;

  return [
    tw`relative h-[6px] overflow-hidden`,
    css`
      background: rgba(255, 255, 255, 0.1);
      -webkit-mask-image: ${cut};
      mask-image: ${cut};
    `,
  ];
});

export const Entries = styled.ol(() => [
  tw`m-0 p-0 list-none flex flex-col text-xs md:text-sm`,
  css`
    & > li + li {
      border-top: 1px solid ${RULE};
    }
  `,
]);

export const Entry = tw.li`flex flex-row items-baseline justify-between gap-[10px] py-[8px]`;

// What stays at the foot of a panel, under its scrolling body (a station's way to cast off).
export const Footer = styled.div(() => [
  tw`flex flex-col gap-[8px] px-[16px] py-[12px]`,
  css`
    border-top: 1px solid ${RULE};
  `,
]);

export const Amount = styled.span(({ isGain }: { isGain: boolean }) => [
  tw`tabular-nums whitespace-nowrap font-semibold`,
  isGain ? tw`text-[#6ee7a8]` : tw`text-[#ff9aa5]`,
]);

// Tiles in a grid, as many to a row as fit: badges, codex entries, paints and trails.
export const TileGrid = styled.ul(({ min = 76 }: { min?: number }) => [
  tw`m-0 p-0 list-none grid gap-[8px]`,
  css`
    grid-template-columns: repeat(auto-fill, minmax(${min}px, 1fr));
  `,
]);

export const Tile = styled.button(({ isOn, isDim = false }: { isOn: boolean; isDim?: boolean }) => [
  tw`flex flex-col items-center justify-center gap-[6px] w-full h-full min-h-[64px] px-[6px] py-[10px] cursor-pointer text-center text-[11px] md:text-xs
     font-semibold leading-snug border-[1px] border-solid`,
  isOn ? tint(14) : tw`bg-[rgba(255,255,255,0.03)]`,
  css`
    color: ${isDim ? "#8a93ab" : "#ffffff"};
    border-color: ${isOn ? "var(--tab-accent)" : RULE};
    transition: border-color 0.2s ease;

    & > svg {
      font-size: 18px;
    }

    &:hover {
      border-color: var(--tab-accent);
    }
  `,
  focusRing("#c4d2ff", 2),
]);

// A tile's name, kept to two lines.
export const TileName = styled.span(() => [
  tw`block w-full overflow-hidden`,
  css`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `,
]);

// Something still to find: a small dim mark for each, in a row under what is found.
export const Unknowns = tw.ul`m-0 p-0 list-none flex flex-row flex-wrap items-center gap-[6px]`;

export const Unknown = styled.li(() => [
  tw`flex items-center justify-center w-[28px] h-[28px] text-xs font-semibold text-[#4a5270]`,
  css`
    border: 1px dashed rgba(196, 210, 255, 0.16);
  `,
]);

// A group's title with its count beside it.
export const GroupTop = tw.div`flex flex-row items-baseline justify-between gap-[10px]`;

// The ability bar's six slots as the Loadout shows them, as on the bar: the one chosen edged in the accent.
export const SlotGrid = tw.ol`m-0 p-0 list-none grid grid-cols-6 gap-[6px]`;

export const BarSlotButton = styled.button(({ colour, isOn, isEmpty }: { colour: string; isOn: boolean; isEmpty: boolean }) => [
  tw`relative flex flex-col items-center justify-center w-full min-h-[52px] p-0 cursor-pointer text-[11px] font-semibold tabular-nums`,
  isOn ? tint(16) : tw`bg-[rgba(255,255,255,0.03)]`,
  css`
    color: ${isEmpty ? "#6d7591" : colour};
    border: 1px ${isEmpty ? "dashed" : "solid"} ${isOn ? "var(--tab-accent)" : RIM};

    & > svg {
      font-size: 17px;
    }
  `,
  focusRing("#c4d2ff", 2),
]);

export const SlotKey = tw.span`absolute top-[3px] left-[5px] text-[9px] text-[#9aa3bb]`;

export const SlotCount = tw.span`absolute bottom-[3px] right-[5px] text-[10px] text-white`;

// The pilot's two standings side by side: their rank and their level.
export const Standings = tw.div`grid grid-cols-2 gap-[14px]`;

export const Standing = tw.div`flex flex-col gap-[4px] min-w-0`;

export const StandingValue = tw.p`m-0 text-lg font-semibold text-white leading-tight`;

// The ship drawn in a paint being tried, and the trail behind it.
export const PreviewCanvas = tw.canvas`block w-full h-[150px]`;

export const TrailBar = styled.span(({ core, edge }: { core: string; edge: string }) => [
  tw`block h-[6px] w-full`,
  css`
    background: linear-gradient(90deg, transparent, ${edge} 30%, ${core} 70%, #ffffff);
  `,
]);

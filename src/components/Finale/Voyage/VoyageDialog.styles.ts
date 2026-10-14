
import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { focusRing, honourHidden, media, voyagePanel } from "@/styles/mixins";

// The whole screen, edge to edge, over a black backdrop.
// Inside a compact HUD (the dialog's data-hud, set from the voyage-hud setting and the screen's size), which keeps to
// what matters in the moment: thin bars, the quest on one line, a slim telemetry, and the rest behind its info button.
// A rule under it must not depend on a prop: styled-components writes it against the component's shared class, so a
// prop's variant would reach every instance. What differs per element is read from a data attribute instead.
const COMPACT = '[data-hud="compact"] &';

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

    /* Over the radar, which opens the map. */
    &[data-over-radar="true"] {
      cursor: pointer;
    }
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

// A dark halo round every letter, so the readings that stand on the view itself keep their contrast over the Sun's glare
// or a day sky.
const halo = "text-shadow: 0 0 2px #000000, 0 1px 3px rgba(0, 0, 0, 0.9);";

// The HUD as one grid over the view, every panel in an area of its own, so none can cover another however long what it
// says or however many alerts are up (e2e/hud.spec.ts measures it at every size). Three layouts:
// - a phone held upright (and a tablet held upright): the buttons, the readout and the place each a row across the top,
//   then the column of bars with the ability bar down the right beside it, the voyage's line, the alerts, and along the
//   bottom the radar and the telemetry;
// - a wider screen: the place and the column of bars down the left, the readout and the buttons along the top, the
//   line and the alerts between the column and the telemetry on the right, the radar and the ability bar along the
//   bottom;
// - a phone on its side: as wide, the readout under the buttons and the ability bar between the radar and the corner.
// The column of bars takes the room it needs, short of the alerts' least, and cuts off what has no room; the alerts take
// the rest. The line's strip on a phone is the one overlap by design, over the readout and the place for its moment.
export const Hud = styled.header(() => [
  tw`absolute inset-0 grid gap-[8px] p-[14px] md:p-[18px] pointer-events-none`,
  css`
    /* Its own stacking context, so the gradient below sits behind every panel rather than over them. */
    isolation: isolate;
    /* The radar's size as MapLayer draws it: a radius of 58, 44 on a smaller screen, 38 on the smallest. */
    --radar: 116px;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-rows: auto auto auto minmax(0, auto) auto minmax(96px, 1fr) auto;
    grid-template-areas:
      "buttons buttons buttons"
      "readout readout readout"
      "place   place   place"
      "vitals  vitals  bar"
      "message message bar"
      "alerts  alerts  bar"
      "radar   side    side";

    /* Static, for legibility over a bright planet; nothing behind it moves the gradient. */
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
      pointer-events: none;
      z-index: -1;
    }

    @media (max-width: 639px), (max-height: 419px) {
      --radar: 88px;
    }

    @media (max-height: 359px), (max-width: 299px), (orientation: portrait) and (max-height: 520px) {
      --radar: 76px;
    }

    /* Where there is room: the first column exactly the radar's width, so the ability bar spans from the radar to the
       telemetry along the bottom; the place and the column down the left span it and a second column, together at
       most 260px wide (as wide as the bars and the faults beside them), so a long place or a world's card wraps
       rather than taking the room the middle needs. */
    ${media.voyageWide} {
      column-gap: 12px;
      grid-template-columns: var(--radar) fit-content(calc(260px - var(--radar) - 12px)) minmax(0, 1fr) auto;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      grid-template-areas:
        "place  place  readout buttons"
        "vitals vitals message ."
        "vitals vitals alerts  side"
        "radar  bar    bar     side";
    }

    /* The readout's row is tall enough for the line's strip laid over it. */
    ${media.shortLandscape} {
      column-gap: 12px;
      grid-template-columns: var(--radar) fit-content(calc(260px - var(--radar) - 12px)) minmax(0, 1fr) auto;
      grid-template-rows: auto minmax(32px, auto) minmax(0, 1fr) auto;
      grid-template-areas:
        "place  place  buttons buttons"
        "vitals vitals readout readout"
        "vitals vitals alerts  side"
        "radar  bar    bar     side";
    }

    /* Hidden in photo mode and on the map. */
    ${honourHidden}
  `,
]);

// The column of the ship and the bars, the quest followed, what is hurt and the target; what has no room in its area
// is cut off rather than reaching another panel.
export const Vitals = styled.div(() => [
  tw`flex flex-col gap-[6px] min-w-0 min-h-0 overflow-hidden`,
  css`
    grid-area: vitals;
    align-self: start;
    max-height: 100%;
    ${halo}
  `,
]);

// Where the ship is, over the column (a row of its own across a phone held upright).
export const Place = styled.p(() => [
  tw`m-0 text-sm md:text-base font-semibold text-[#c4d2ff] tabular-nums`,
  css`
    grid-area: place;
    align-self: start;
    ${halo}
  `,
]);

export const Bars = styled.dl(() => [
  tw`m-0 flex flex-col gap-[4px] w-[150px] md:w-[210px]`,
  css`
    ${COMPACT} {
      gap: 3px;
    }
  `,
]);

// The bars and, where the HUD can be compact, the button that opens it in full or tucks it back.
export const BarsRow = tw.div`flex flex-row items-center gap-[8px]`;

export const HudToggle = styled.button(() => [
  tw`relative flex items-center justify-center w-[30px] h-[30px] p-0 cursor-pointer text-[#c4d2ff] bg-[rgba(10,14,30,0.75)] border-[1px] border-solid
    border-[#2a3350] rounded-full pointer-events-auto`,
  focusRing("#c4d2ff", 2),
]);

// A red dot on the info button while the compact HUD keeps a hurt system or a fault behind it.
export const HudAlert = styled.span(() => [
  tw`absolute top-[-3px] right-[-3px] w-[10px] h-[10px] rounded-full bg-[#ff4d5e]`,
  css`
    border: 2px solid #03050c;
  `,
]);

// A little tighter on the shortest upright phone, where the column has to make room for what is hurt.
export const BarRow = styled.div(() => [
  tw`grid items-center gap-x-[8px] gap-y-[2px] text-xs tabular-nums`,
  css`
    grid-template-columns: 1fr auto;

    ${media.shortestPortrait} {
      font-size: 11px;
      line-height: 14px;
    }

    ${COMPACT} {
      grid-template-columns: 12px 1fr;
      column-gap: 6px;
      row-gap: 0;
    }
  `,
]);

// Beside each bar in the compact HUD, which shows the bars without their names: what each one is, in its colour, so
// they are told apart by more than colour (WCAG 1.4.1).
export const BarIcon = styled.span(({ colour }: { colour: string }) => [
  tw`hidden items-center justify-center text-[10px]`,
  css`
    color: ${colour};

    ${COMPACT} {
      display: inline-flex;
    }
  `,
]);

// The compact HUD shows the bars alone, told apart by colour; their names and figures are in the full HUD.
export const BarLabel = styled.dt(() => [
  tw`text-[#9aa3bb]`,
  css`
    ${COMPACT} {
      display: none;
    }
  `,
]);

export const BarValue = styled.dd(() => [
  tw`m-0 text-right text-white`,
  css`
    ${COMPACT} {
      display: none;
    }
  `,
]);

export const BarTrack = styled.div(() => [
  tw`relative h-[6px] overflow-hidden bg-[rgba(255,255,255,0.12)]`,
  css`
    grid-column: 1 / -1;

    ${media.shortestPortrait} {
      height: 4px;
    }

    ${COMPACT} {
      height: 4px;
      grid-column: 2;
    }
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

// Where the ship stands on a world: in the corner the radar keeps in flight (as wide as the screen allows on an
// upright phone, where the telemetry steps aside for it); on a phone on its side, in the telemetry's corner instead,
// where it steps aside for it, clear of the column of bars on the left.
export const SurfaceCard = styled.section(() => [
  tw`m-0 p-[8px] md:p-[12px] flex flex-col gap-[2px] min-w-0 pointer-events-none`,
  css`
    grid-area: radar;
    align-self: end;
    justify-self: start;
    max-width: min(100%, 300px);
    ${voyagePanel()}

    /* Where there is room it takes the radar's corner and the column's width beside it (the bar keeping to the middle
       while it shows, the HUD marked data-card). */
    ${media.voyageWide} {
      grid-column: 1 / 3;
    }

    ${media.shortLandscape} {
      grid-area: side;
      justify-self: end;
      max-width: min(28vw, 190px);
    }
  `,
]);

export const SurfaceTitle = tw.h3`m-0 text-xs md:text-sm font-semibold text-white`;

// The card's details: left to the full HUD when the HUD is compact, which keeps the title, the phase, what to do and,
// coming down, how high and how fast falling (marked data-slim).
export const SurfaceLine = styled.p(() => [
  tw`m-0 text-[11px] md:text-xs text-[#c4d2ff]`,
  css`
    ${COMPACT}:not([data-slim]) {
      display: none;
    }
  `,
]);

// How a world is come down on: kept to two lines on a phone on its side, where the card has the corner's height only,
// and left out on the shortest upright phone, where the title and the phase say enough.
export const SurfaceMethod = styled.p(() => [
  tw`m-0 text-[11px] md:text-xs text-[#c4d2ff]`,
  css`
    ${media.shortestPortrait} {
      display: none;
    }

    ${COMPACT} {
      display: none;
    }

    ${media.shortLandscape} {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
]);

// The hull's heat and the air, from the telemetry: shown in the card only where the telemetry steps aside for it.
export const SurfaceReading = styled.p(() => [
  tw`hidden m-0 text-[11px] md:text-xs text-[#c4d2ff] tabular-nums`,
  css`
    ${media.narrowPortrait} {
      display: block;
    }

    ${media.shortLandscape} {
      display: block;
    }

    ${COMPACT} {
      display: none;
    }
  `,
]);

// What the way down is doing now, the line a reader looks for first.
export const SurfacePhase = tw.p`m-0 my-[2px] text-xs md:text-sm font-semibold text-[#ffd27a]`;

export const SurfaceHint = tw.p`m-0 mt-[4px] text-[11px] md:text-xs text-[#9aa3bb]`;

// The live readings in the bottom right; on a narrow upright phone, where the two would overlap, and on a phone on
// its side it steps aside while a world's card shows.
export const TelemetryPanel = styled.section(({ isYielding = false }: { isYielding?: boolean }) => [
  tw`p-[8px] md:p-[12px] pointer-events-none`,
  css`
    grid-area: side;
    align-self: end;
    justify-self: end;
    min-width: 170px;
    max-width: min(66vw, 300px);
    ${voyagePanel()}

    ${media.md} {
      min-width: 200px;
    }

    ${media.narrowPortrait} {
      ${isYielding ? "display: none;" : ""}
    }

    ${media.shortLandscape} {
      min-width: 0;
      max-width: min(28vw, 190px);
      ${isYielding ? "display: none;" : ""}
    }
  `,
]);

// Left out of the compact HUD's slim telemetry, whose two readings say what they are.
export const TelemetryTitle = styled.h2(() => [
  tw`m-0 mb-[4px] md:mb-[6px] text-[11px] md:text-xs font-semibold text-[#c4d2ff]`,
  css`
    ${COMPACT} {
      display: none;
    }
  `,
]);

export const TelemetryList = tw.dl`m-0 flex flex-col gap-[2px] md:gap-[3px] text-[11px] md:text-xs tabular-nums`;

// Only the key readings on narrow screens and on a phone on its side, only the slim ones (how fast, where to, marked
// data-slim) in a compact HUD; every reading where there is room.
export const TelemetryRow = styled.div(({ isKey }: { isKey: boolean }) => [
  tw`flex flex-row items-baseline justify-between gap-[10px] md:gap-[14px]`,
  !isKey && tw`hidden md:flex`,
  !isKey && css`
    ${media.shortLandscape} {
      display: none;
    }
  `,
  css`
    ${COMPACT}:not([data-slim]) {
      display: none;
    }
  `,
]);

export const TelemetryName = tw.dt`text-[#9aa3bb]`;

export const TelemetryValue = tw.dd`m-0 text-right text-white`;

// The score and the purse: a row of its own at the right under the buttons on a phone, between the place and the
// buttons where there is room.
export const Readout = styled.dl(() => [
  tw`m-0 flex flex-row flex-wrap items-center justify-end gap-x-[12px] gap-y-[2px] md:gap-x-[16px] md:gap-y-[4px] text-sm tabular-nums pointer-events-none`,
  css`
    grid-area: readout;
    justify-self: end;
    align-self: center;
    ${halo}

    ${media.voyageWide} {
      justify-self: center;
      align-self: start;
    }

    ${media.shortLandscape} {
      justify-self: end;
      align-self: center;
    }
  `,
]);

export const Reading = tw.div`flex flex-row items-baseline gap-[6px]`;

export const ReadingName = tw.dt`text-xs text-[#9aa3bb]`;

export const ReadingValue = tw.dd`m-0 font-semibold text-white`;

// The buttons at the top right, a little smaller where all six would not fit at full size (a foldable's cover screen).
export const HudButtons = styled.div(() => [
  tw`flex flex-row gap-[8px] pointer-events-auto`,
  css`
    grid-area: buttons;
    justify-self: end;
    align-self: start;

    ${media.narrow} {
      gap: 5px;

      & > button {
        width: 36px;
        height: 36px;
      }
    }
  `,
]);

// The ship's systems, listed only once one of them is hurt, each with a small bar; a little narrower on the shortest
// upright phone.
export const Systems = styled.dl(() => [
  tw`m-0 mt-[4px] flex flex-col gap-[3px] w-[150px] md:w-[210px]`,
  css`
    ${media.shortestPortrait} {
      width: 120px;
    }

    ${COMPACT} {
      display: none;
    }
  `,
]);

// Over the systems and over the faults; with both, behind the compact HUD's info button, whose dot says they wait.
export const SystemsTitle = styled.p(() => [
  tw`m-0 mt-[6px] text-[11px] md:text-xs font-semibold text-[#c4d2ff]`,
  css`
    ${COMPACT} {
      display: none;
    }
  `,
]);

export const SystemRow = styled.div(() => [
  tw`grid items-center gap-x-[8px] text-[11px] tabular-nums`,
  css`
    grid-template-columns: 1fr 48px;
  `,
]);

export const SystemName = tw.dt`text-[#9aa3bb] truncate`;

export const SystemTrack = tw.dd`relative m-0 h-[4px] overflow-hidden bg-[rgba(255,255,255,0.12)]`;

export const Credits = tw.p`m-0 text-[11px] text-[#7d859c] leading-snug`;

// MMO frames: the target under the vitals (a little narrower on the shortest upright phone); the boss and any rock
// headed for a world among the alerts.
export const TargetFrame = styled.section(() => [
  tw`mt-[6px] flex flex-col gap-[3px] w-[150px] md:w-[210px] p-[6px] bg-[rgba(5,8,18,0.7)]`,
  css`
    border: 1px solid rgba(255, 77, 94, 0.45);

    ${media.shortestPortrait} {
      width: 120px;
    }
  `,
]);

// A frame's name and its standing: a long name is cut short with an ellipsis and the standing always shows beside it;
// on the shortest upright phone, where the target's frame is narrow, the standing wraps under the name instead.
export const FrameName = styled.p(() => [
  tw`m-0 flex flex-row items-baseline justify-between gap-[6px] text-[11px] md:text-xs font-semibold text-white min-w-0`,
  css`
    ${media.shortestPortrait} {
      flex-wrap: wrap;
      gap: 0 6px;
    }
  `,
]);

export const FrameTitle = tw.span`min-w-0 truncate`;

export const FrameMeta = tw.span`flex-shrink-0 text-[10px] md:text-[11px] font-normal text-[#9aa3bb] whitespace-nowrap`;

export const FrameTrack = tw.div`relative h-[5px] overflow-hidden bg-[rgba(255,255,255,0.12)]`;

// The room the line standing for alerts with no room keeps at the top of theirs (px).
export const ALERTS_MORE_PX = 28;

// The alerts in the room between the column and the bottom, stacked up from the bottom, nearest the ship, the most
// urgent lowest: what has no whole room above them folds away (marked data-folded) under one line saying how many more
// there are, which opens them all to be scrolled through in the same room (data-expanded).
export const Frames = styled.div(() => [
  tw`relative flex flex-col justify-end gap-[6px] w-full min-h-0 overflow-hidden pointer-events-none`,
  css`
    grid-area: alerts;
    justify-self: center;
    max-width: 420px;

    & > [data-folded] {
      visibility: hidden;
    }

    /* Opened, only the alerts themselves take a press (and scroll the list), never the empty room round them, where
       the ship is steered. */
    &[data-expanded] {
      justify-content: flex-start;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    &[data-expanded] > * {
      pointer-events: auto;
    }
  `,
]);

// The line standing for the folded alerts, at the top of their room: how many more, pressed to open them all.
export const AlertsMore = styled.button(() => [
  tw`absolute top-0 left-1/2 flex items-center justify-center h-[24px] px-[10px] text-[11px] font-semibold whitespace-nowrap text-[#c4d2ff]
    cursor-pointer pointer-events-auto bg-[rgba(10,14,30,0.85)] border-[1px] border-solid border-[#2a3350] rounded-full`,
  css`
    transform: translateX(-50%);
    ${focusRing("#c4d2ff", 2)}

    [data-expanded] > & {
      position: sticky;
      top: 0;
      z-index: 1;
      align-self: center;
      transform: none;
    }
  `,
]);

// The room the radar is drawn in on the canvas, bottom left, kept clear of the panels: as big as MapLayer draws it
// (the HUD's --radar, 14px in from the corner).
export const RadarSpace = styled.div(() => [
  tw`pointer-events-none`,
  css`
    grid-area: radar;
    align-self: end;
    justify-self: start;
    width: var(--radar);
    height: var(--radar);

    /* The HUD's own margin is 18px there, the radar's 14px. */
    ${media.md} {
      margin: 0 0 -4px -4px;
    }
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
  focusRing("#c4d2ff", 2),
]);

// Rising into its place, then fading.
const fadeLine = keyframes`
  0% { opacity: 0; transform: translateY(6px); }
  12% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
`;

// On a short phone the line is a strip across the top instead, so it eases in from above without moving sideways.
const fadeStrip = keyframes`
  0% { opacity: 0; transform: translateY(-2px); }
  10% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
`;

// The strip without the movement.
const showStrip = keyframes`
  0%, 99% { opacity: 1; }
  100% { opacity: 0; }
`;

// Where the line becomes a strip across the top: a phone too short for it to sit between the bars and the ship, held
// upright or on its side, a narrow upright phone (whose column of bars starts lower, where the line would sit), and
// any phone on its side however wide.
const STRIP = "@media (max-width: 767px) and (max-height: 720px), (orientation: portrait) and (max-width: 479px), " +
  "(orientation: landscape) and (max-height: 500px)";

// The same without the movement: there for its moment, then gone.
const showLine = keyframes`
  0%, 99% { opacity: 1; }
  100% { opacity: 0; }
`;

// Each moment of the voyage, said once and gone, for as long as "--message-ms" gives it to be read. Keyed per
// message, so a new one plays from the start. In its own area of the HUD's grid, between the column and the telemetry,
// as wide as its words need, so a long line of the story reads in a few lines without hiding anything.
// A quest done, as a card in the line's place: what kind of quest, its name, what it paid, and for a chapter the line
// it decoded to. Spans, since it lives in the line's paragraph.
export const CardText = tw.span`flex flex-col gap-[2px] min-w-0`;

export const CardTitle = styled.span(() => [tw`flex flex-row items-center gap-[6px] text-[11px] font-semibold text-[#ff9f5a]`]);

export const CardName = styled.span(() => [
  tw`text-[15px] md:text-base font-semibold text-white`,
  css`
    line-height: 1.375;
  `,
]);

export const CardReward = tw.span`flex flex-row flex-wrap items-center gap-x-[8px] text-xs font-semibold text-[#c9cfdf] tabular-nums`;

export const CardLine = styled.span(() => [
  tw`block mt-[4px] pl-[8px] text-xs md:text-sm font-normal text-[#e6e9f2]`,
  css`
    line-height: 1.625;
    border-left: 2px solid #ffd76a;
  `,
]);

export const Message = styled.p(({ isCard = false }: { isCard?: boolean }) => [
  tw`m-0 px-[14px] py-[8px] text-sm md:text-base font-semibold text-center text-white pointer-events-none`,
  css`
    grid-area: message;
    justify-self: center;
    align-self: start;
    width: max-content;
    max-width: min(100%, 520px);
    ${voyagePanel(0.72, 0.35)}

    /* Held, while the run is paused or the hangar is open: the fade waits with the line. */
    &[data-held] {
      animation-play-state: paused;
    }
    ${isCard ? "text-align: left; border-left: 2px solid #ff9f5a;" : ""}
    animation: ${fadeLine} var(--message-ms, 2800ms) ease both;

    ${media.reducedMotion} {
      animation-name: ${showLine};
      animation-timing-function: linear;
    }

    /* A short phone has no room under the bars before the ship: the line becomes a strip across the top, under the
       buttons, over the place and the readout for its moment, its way to the quest log beside the words rather than
       under them, so up to three lines stay clear of the bars, the ship and the faults. */
    ${STRIP} {
      position: absolute;
      inset: 0;
      grid-area: auto;
      grid-row: readout-start / place-end;
      grid-column: 1 / -1;
      /* Exactly its rows, however much it says: what has no room is cut off, never laid over the bars below. */
      align-self: stretch;
      justify-self: stretch;
      overflow: hidden;
      width: auto;
      max-width: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 6px 10px;
      font-size: 12px;
      line-height: 1.35;
      background: rgb(5, 8, 18);
      animation-name: ${fadeStrip};

      & > button {
        flex-shrink: 0;
        margin-left: 0;
      }

      /* A card starts at its top, so what is cut off for the strip's height is its end, not its name. */
      ${isCard ? "justify-content: space-between; align-items: flex-start;" : ""}

      /* The chip beside it says it is a quest, so the card's kind gives its room to the chapter's line. */
      ${CardTitle} {
        display: none;
      }

      ${CardName} {
        font-size: 13px;
      }

      ${CardLine} {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 11px;
        line-height: 1.4;
      }
    }

    /* On a phone on its side the strip lies over the readout's row only, beside the column of bars. */
    ${media.shortLandscape} {
      grid-row: auto;
      grid-column: auto;
      grid-area: readout;
    }

    /* Kept still, the strip shows without the slide; written after the line's own still rule, which it overrides. */
    ${STRIP} {
      ${media.reducedMotion} {
        animation-name: ${showStrip};
      }
    }
  `,
]);

// The quest followed, under the bars in the left column: its objective and how far along it is, and what it belongs
// to, read through like the rest of the HUD so it never takes the pointer that steers; only its scroll opens the
// quest log. On a short upright phone in full it steps aside while a system is hurt or a fault waits, which need its
// room more (a compact HUD keeps those behind its info button, so the quest stays).
export const Tracker = styled.div(({ isYielding = false }: { isYielding?: boolean }) => [
  tw`flex flex-row items-center gap-[6px] w-[150px] md:w-[210px] mt-[2px] pl-[8px] py-[4px] pr-[4px]`,
  css`
    ${voyagePanel(0.55, 0.25)}
    border-left: 2px solid #ff9f5a;

    ${media.shortPortrait} {
      ${isYielding ? "display: none;" : ""}
    }
  `,
]);

export const TrackerText = tw.span`flex flex-col gap-[1px] flex-1 min-w-0`;

// One line in a compact HUD, the name cut short before its count.
export const TrackerName = styled.span(() => [
  tw`flex flex-row items-baseline justify-between gap-[6px] text-[11px] md:text-xs font-semibold text-white leading-snug`,
  css`
    ${COMPACT} {
      white-space: nowrap;

      & > span:first-of-type {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `,
]);

export const TrackerCount = tw.span`tabular-nums text-[#ffcf9f] whitespace-nowrap`;

// What the quest belongs to; left out on a short upright phone and on a phone on its side, where the column is short.
export const TrackerSub = styled.span(() => [
  tw`text-[10px] md:text-[11px] text-[#aab3c9] truncate`,
  css`
    ${media.shortPortrait} {
      display: none;
    }

    ${COMPACT} {
      display: none;
    }

    ${media.shortLandscape} {
      display: none;
    }
  `,
]);

export const TrackerOpen = styled.button(() => [
  tw`flex flex-shrink-0 items-center justify-center w-[34px] h-[34px] p-0 cursor-pointer text-[#ff9f5a] bg-[rgba(10,14,30,0.75)] border-[1px] border-solid
     border-[#3a4566]`,
  css`
    pointer-events: auto;
  `,
  focusRing("#c4d2ff", 2),
]);

// The way from a line about a quest to the quest log: a small chip after its words, the only part of the line that
// takes a press.
export const MessageButton = styled.button(() => [
  tw`inline-flex items-center gap-[4px] ml-[8px] px-[8px] py-[2px] cursor-pointer text-[11px] font-semibold text-[#ffcf9f] bg-transparent border-[1px]
     border-solid border-[#ff9f5a] align-middle`,
  css`
    min-height: 28px;
    pointer-events: auto;
  `,
  focusRing("#c4d2ff", 2),
]);

// Under the HUD's buttons (so they still answer while a card is up), the card's own scrolling area: the whole of it
// scrolls as one, so a card taller than a short phone is read to the end. Some phones will not scroll a box nested
// inside a layer that lets touches through to the canvas, so this layer takes the touches itself; the paused card,
// short enough for any screen, lets them through instead, so the fixes and the suggestion beside it still answer.
// A control focused by the keyboard is scrolled clear of the pinned buttons.
export const Overlay = styled.div(({ isPassThrough }: { isPassThrough: boolean }) => [
  tw`absolute left-0 right-0 bottom-0 top-[58px] md:top-[72px] flex flex-col items-center px-[16px] pt-[6px] pb-[16px]`,
  isPassThrough ? tw`pointer-events-none` : tw`pointer-events-auto`,
  css`
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    scroll-padding-bottom: 128px;

    ${media.md} {
      scroll-padding-bottom: 96px;
    }
  `,
]);

// Centred where it fits, from the top where it does not; it never scrolls inside itself. Framed as the hangar's
// panels are, its corners bracketed in the colour of the moment: pale before a flight, gold at a run's end.
export const Card = styled.section(({ isPassThrough, accent = "#c4d2ff" }: { isPassThrough: boolean; accent?: string }) => [
  tw`relative flex flex-col gap-[12px] w-full max-w-[460px] p-[22px] md:p-[28px]`,
  isPassThrough && tw`pointer-events-auto`,
  css`
    margin: auto 0;
    flex-shrink: 0;
    ${voyagePanel(0.86, 0.3)}

    /* The brackets are drawn over everything in the card, so the pinned buttons at its foot never hide the lower two. */
    &::after {
      content: "";
      position: absolute;
      inset: -1px;
      pointer-events: none;
      background:
        linear-gradient(${accent}, ${accent}) left top / 18px 2px,
        linear-gradient(${accent}, ${accent}) left top / 2px 18px,
        linear-gradient(${accent}, ${accent}) right top / 18px 2px,
        linear-gradient(${accent}, ${accent}) right top / 2px 18px,
        linear-gradient(${accent}, ${accent}) left bottom / 18px 2px,
        linear-gradient(${accent}, ${accent}) left bottom / 2px 18px,
        linear-gradient(${accent}, ${accent}) right bottom / 18px 2px,
        linear-gradient(${accent}, ${accent}) right bottom / 2px 18px;
      background-repeat: no-repeat;
    }
  `,
]);

// Where the pilot stands, as the card before a flight opens: rank and level, coin and shards, the quest followed.
export const Chips = tw.div`flex flex-row flex-wrap gap-[6px]`;

export const Chip = styled.span(({ colour = "#c9cfdf" }: { colour?: string }) => [
  tw`inline-flex items-center gap-[6px] min-h-[30px] px-[10px] text-xs font-semibold tabular-nums`,
  css`
    color: ${colour};
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(196, 210, 255, 0.18);
  `,
]);

// The controls, folded under a title the pilot opens (open the first time the voyage opens).
export const HowTo = styled.details(() => [
  tw`block`,
  css`
    border-top: 1px solid rgba(196, 210, 255, 0.14);
    padding-top: 10px;

    /* Its own arrow, the same in every browser, turning as it opens. */
    & > summary {
      cursor: pointer;
      min-height: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      list-style: none;
      font-size: 14px;
      font-weight: 600;
      color: #c4d2ff;
    }

    & > summary::-webkit-details-marker {
      display: none;
    }

    & > summary::before {
      content: "";
      border-left: 6px solid currentColor;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      transition: transform 0.15s ease;
    }

    &[open] > summary::before {
      transform: rotate(90deg);
    }

    ${media.reducedMotion} {
      & > summary::before {
        transition: none;
      }
    }

    & > summary:focus-visible {
      outline: 2px solid #c4d2ff;
      outline-offset: 2px;
    }

    & > p {
      margin-top: 4px;
    }
  `,
]);

// A run's figures at its end, as tiles: the figure large and what it is under it; one too long for a tile spans the
// row.
export const StatGrid = tw.dl`m-0 grid grid-cols-2 md:grid-cols-3 gap-[8px]`;

export const Stat = styled.div(({ isWide = false }: { isWide?: boolean }) => [
  tw`flex flex-col gap-[2px] px-[10px] py-[8px]`,
  isWide && tw`col-span-2 md:col-span-3`,
  css`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(196, 210, 255, 0.14);

    & > dd {
      order: -1;
      margin: 0;
      font-size: ${isWide ? "13px" : "18px"};
      font-weight: 600;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
    }

    & > dt {
      font-size: 11px;
      color: #9aa3bb;
    }
  `,
]);

// A card's actions, held at the bottom of the screen while the rest of a long card scrolls under them; always the
// card's last part, so it reaches the card's edges.
export const CardButtons = styled.div(() => [
  tw`flex flex-row flex-wrap gap-[10px] mt-[6px] px-[22px] pt-[12px] pb-[18px] md:px-[28px] md:pb-[24px]`,
  css`
    position: sticky;
    bottom: -16px;
    margin: 6px -22px -22px;
    background: linear-gradient(to bottom, rgba(5, 8, 18, 0), #05080f 14px);

    ${media.md} {
      margin: 6px -28px -28px;
    }
  `,
]);

export const Title = tw.h2`m-0 text-2xl md:text-3xl font-semibold text-white`;

export const Text = tw.p`m-0 text-sm md:text-base text-[#c9cfdf] leading-relaxed`;

// The first time the voyage opens: how the pilot likes to fly, set before the first flight.
export const Setup = tw.section`flex flex-col gap-[10px] p-[12px] border-[1px] border-solid border-[rgba(196,210,255,0.25)] text-left`;

export const SetupTitle = tw.h3`m-0 text-base font-semibold text-white`;

export const Score = tw.p`m-0 text-4xl md:text-5xl font-bold text-[#ffd76a] tabular-nums leading-none`;

// The score and what it won, side by side, the badge centred on the score.
export const ScoreRow = styled.div(() => [
  tw`flex flex-row flex-wrap items-center gap-[10px]`,
  css`
    & > p {
      align-self: center;
    }
  `,
]);

export const Badge = tw.p`m-0 self-start px-[10px] py-[4px] text-xs font-semibold text-[#101010] bg-[#ffc45c]`;

// The ship's hull and mark, under where it is.
// The rank and the ship; left out on a short upright phone and on a phone on its side, where the column is short (the
// hangar says both).
export const ShipLine = styled.p(() => [
  tw`m-0 text-[11px] md:text-xs text-[#9aa3bb]`,
  css`
    ${media.shortPortrait} {
      display: none;
    }

    ${COMPACT} {
      display: none;
    }

    ${media.shortLandscape} {
      display: none;
    }
  `,
]);

// Red Coin gold, Void Shards violet.
export const Coin = styled.dd(({ isShards = false }: { isShards?: boolean }) => [
  tw`relative m-0 font-semibold`,
  isShards ? tw`text-[#c58bff]` : tw`text-[#ffd76a]`,
]);

const floatGain = keyframes`
  0% { opacity: 0; transform: translateY(4px); }
  15% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-16px); }
`;

// What a count just rose by, floating up off it and gone.
export const Gain = styled.span(() => [
  tw`absolute right-0 bottom-full text-[11px] md:text-xs font-bold whitespace-nowrap pointer-events-none`,
  css`
    animation: ${floatGain} 1.2s ease-out both;

    ${media.reducedMotion} {
      animation-name: none;
      opacity: 1;
    }
  `,
]);

// Faults on board, each with its fix; the buttons take clicks through the HUD. On the shortest upright phone narrow
// enough to clear the telemetry beside it.
export const FaultList = styled.ul(() => [
  tw`m-0 mt-[4px] p-0 list-none flex flex-col gap-[4px] w-[170px] md:w-[230px] pointer-events-auto`,
  css`
    ${media.shortestPortrait} {
      width: 120px;
    }

    ${COMPACT} {
      display: none;
    }
  `,
]);

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

    ${focusRing("#c4d2ff", 2)}
  `,
]);

// What a fault needs, under it, when the hold has nothing that fixes it. Left to its button on the shortest upright
// phone, whose press says the same, and still read with the button by a screen reader.
export const FaultNeed = styled.p(() => [
  tw`m-0 w-full text-[10px] md:text-[11px] font-normal leading-snug text-[#e3b5bb]`,
  css`
    ${media.shortestPortrait} {
      display: none;
    }
  `,
]);

// The one thing ready to do, in one click.
export const ReadyButton = styled.button(() => [
  tw`flex flex-row items-center justify-center gap-[8px] px-[12px] py-[8px] text-xs md:text-sm font-semibold cursor-pointer text-[#101010] bg-[#7dffcf] border-0
     pointer-events-auto`,
  css`
    box-shadow: 0 0 0 1px rgba(125, 255, 207, 0.4), 0 0 18px rgba(125, 255, 207, 0.35);

    ${focusRing("#ffffff", 2)}
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
    ${voyagePanel(0.82, 0.35)}
  `,
]);

export const PhotoHint = tw.p`m-0 w-full text-center text-xs md:text-sm text-[#c9cfdf]`;

// Photo mode's look round and zoom buttons, for a reader who cannot drag or pinch.
export const PadButtons = tw.div`flex flex-row flex-wrap items-center justify-center gap-[8px] w-full`;

// Where the voyage's lines are spoken from: off screen, always mounted.
export const LiveRegion = tw.div`sr-only`;

// The map's own bar in place of the HUD: its name, and the way back to flying.
export const MapBar = styled.header(() => [
  tw`absolute top-0 left-0 right-0 flex flex-row items-center gap-[8px] p-[14px] md:p-[18px]`,
  css`
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));

    /* The name on the left, the way back on the right. */
    & > :first-child {
      margin-right: auto;
    }
  `,
]);

export const MapTitle = tw.h2`m-0 text-base md:text-lg font-semibold text-white`;

// The guided first flight's card: a step at a time, among the frames.
export const GuideCard = styled.section(() => [
  tw`flex flex-col gap-[6px] p-[10px] text-xs md:text-sm text-white pointer-events-auto`,
  css`
    ${voyagePanel(0.88, 0.5)}
    border-color: rgba(125, 255, 207, 0.6);
  `,
]);

export const GuideStep = tw.p`m-0 text-[10px] md:text-[11px] font-semibold text-[#7dffcf]`;

export const GuideText = tw.p`m-0 leading-snug`;

export const GuideActions = styled.div(() => [
  tw`flex flex-row gap-[8px]`,
  css`
    & > button {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      color: #101010;
      background: #7dffcf;
      border: 0;
      ${focusRing("#ffffff", 2)}
    }

    & > button + button {
      color: #c9cfdf;
      background: transparent;
      border: 1px solid #3a4566;
    }
  `,
]);

// The thumb stick a touch screen steers with when aiming by hand: drawn where the thumb went down, its knob moved
// by the hook through a variable, never by a render.
export const TouchStick = styled.div(() => [
  tw`absolute left-0 top-0 pointer-events-none`,
  css`
    width: 0;
    height: 0;
    opacity: 0;
    transition: opacity 0.15s linear;

    &::before,
    &::after {
      content: "";
      position: absolute;
      border-radius: 50%;
    }

    &::before {
      width: 112px;
      height: 112px;
      left: -56px;
      top: -56px;
      border: 2px solid rgba(196, 210, 255, 0.45);
      background: rgba(5, 8, 18, 0.25);
    }

    &::after {
      width: 44px;
      height: 44px;
      left: -22px;
      top: -22px;
      background: rgba(196, 210, 255, 0.55);
      transform: var(--knob, translate(0px, 0px));
    }
  `,
]);

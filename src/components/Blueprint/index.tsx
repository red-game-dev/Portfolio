import { FC, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { Architecture } from "@/components/Blueprint/Architecture";
import { Wireframe } from "@/components/Blueprint/Wireframe";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Lens } from "@/config/lenses";
import { ZoneId } from "@/config/zones";
import useInView from "@/hooks/useInView";
import { Blueprint as BlueprintContent, BlueprintJourney, BlueprintLabels } from "@/types/blueprints";

interface BlueprintProps extends BlueprintContent {
  labels: BlueprintLabels;
  // In a section the drawing takes more room than the text column on wide screens; in a dialog it stays inside.
  isBleed?: boolean;
  // Already on screen (a tab just opened), so the drawing is built straight away.
  isEager?: boolean;
}

type View = "overview" | "architecture" | "flow";

// Up to 1200px wide on large screens, centred on the column, so four frames of boxes fit without squeezing.
// 80px stay clear on each side for the zone trail and the social rail fixed at the edges.
const BLEED = "calc((100% - min(1200px, 100vw - 160px)) / 2)";

const Figure = styled.figure(({ isBleed }: { isBleed: boolean }) => [
  tw`m-0 flex flex-col gap-[16px] p-[18px] md:p-[24px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`,
  isBleed && css`
    @media (min-width: 1024px) {
      margin-left: ${BLEED};
      margin-right: ${BLEED};
    }
  `,
]);

const Head = tw.div`flex flex-col gap-[6px]`;

const Title = tw.h3`m-0 text-base md:text-lg font-semibold text-white`;

const Caption = tw.figcaption`text-sm text-[#999] max-w-[70ch]`;

const Toggles = tw.div`flex flex-row flex-wrap gap-[8px]`;

const Toggle = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`h-[32px] px-[12px] cursor-pointer text-xs font-semibold rounded-[2px] border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[var(--accent)] bg-transparent border-[var(--accent-muted)]`,
  css`
    transition: filter 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
      border-color: var(--accent);
    }
  `,
]);

const Body = tw.div`flex flex-col gap-[14px] pt-[4px]`;

const Note = tw.p`m-0 text-xs text-[#8a8a8a]`;

const Facts = tw.dl`grid gap-x-[20px] gap-y-[12px] m-0 md:grid-cols-[120px 1fr]`;

const Term = tw.dt`text-xs font-semibold text-[#8a8a8a] md:pt-[3px]`;

const Value = tw.dd`m-0 text-sm text-[#ddd]`;

const Stack = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Tech = tw.li`text-xs leading-none text-[var(--accent)] bg-[#161616] rounded-full py-[6px] px-[10px] border-[1px] border-solid
border-[var(--accent-muted)]`;

const Journeys = tw.div`grid gap-[14px] md:grid-cols-2`;

const Journey = tw.section`flex flex-col gap-[8px] p-[14px] bg-[#0b0b0b] border-[1px] border-solid border-[#1E1E1E]`;

const JourneyTitle = tw.h4`m-0 text-sm font-semibold text-white`;

// Journeys are real sequences, so their steps are numbered.
const Steps = styled.ol(() => [
  tw`list-none m-0 p-0 flex flex-col gap-[6px] text-sm text-[#bbb]`,
  css`
    counter-reset: step;

    & > li {
      position: relative;
      padding-left: 26px;
      counter-increment: step;
    }

    & > li::before {
      content: counter(step);
      position: absolute;
      left: 0;
      top: 1px;
      width: 18px;
      height: 18px;
      font-size: 10px;
      line-height: 18px;
      text-align: center;
      color: #101010;
      background: var(--accent);
      border-radius: 9999px;
    }
  `,
]);

const GroupHeading = tw.h4`m-0 text-xs font-semibold text-[#8a8a8a]`;

// Which tab each reader opens on: recruiters on the overview (role, scale, stack), product readers on the
// product flow where there is one, engineers on the architecture. The others are one click away.
const defaultView = (lens: Lens, hasFlow: boolean): View => {
  if (lens === "engineer") {
    return "architecture";
  }

  return lens === "product" && hasFlow ? "flow" : "overview";
};

const JourneyList: FC<{ journeys: BlueprintJourney[] }> = ({ journeys }) => (
  <Journeys>
    {journeys.map((journey) => (
      <Journey key={journey.title}>
        <JourneyTitle>{journey.title}</JourneyTitle>
        <Steps>
          {journey.steps.map((step) => <li key={step}>{step}</li>)}
        </Steps>
      </Journey>
    ))}
  </Journeys>
);

// One system shown three ways: what I did and at what scale, how it is built, and what a user moves
// through. All three stay in the page for every reader; only which one is open changes with the view.
export const Blueprint: FC<BlueprintProps> = ({
  zone, title, caption, summary, architecture, wireframe, journeys = [], labels, isBleed = true, isEager = false,
}: BlueprintProps) => {
  const { lens, settings } = useLensStateHook();
  const hasFlow = Boolean(wireframe) || journeys.length > 0;
  const [view, setView] = useState<View>(() => defaultView(lens, hasFlow));
  const figureRef = useRef<HTMLElement>(null);
  const isOnScreen = useInView(figureRef, { once: false, threshold: 0 });
  // Drawings are built as they come within a screen or so of view, not during hydration: they add hundreds
  // of elements the first paint does not need.
  const isNearby = useInView(figureRef, { once: true, threshold: 0, rootMargin: "100% 0px" });
  const isNear = isEager || isNearby;
  const bodyId = useId();

  useEffect(() => {
    setView(defaultView(lens, hasFlow));
  }, [lens, hasFlow]);

  const tabs: Array<{ id: View; label: string }> = [
    { id: "overview", label: labels.overview },
    { id: "architecture", label: labels.architecture },
    ...(hasFlow ? [{ id: "flow" as const, label: labels.productFlow }] : []),
  ];

  return (
    <Figure ref={figureRef} isBleed={isBleed}>
      <Head>
        <Title>{title}</Title>
        <Caption>{caption}</Caption>
      </Head>
      <Toggles>
        {tabs.map((tab) => (
          <Toggle key={tab.id} type="button" isOn={view === tab.id} aria-pressed={view === tab.id} aria-controls={bodyId} onClick={() => setView(tab.id)}>
            {tab.label}
          </Toggle>
        ))}
      </Toggles>
      <Body id={bodyId}>
        {view === "overview" && (
          <Facts>
            <Term>{labels.role}</Term>
            <Value>{summary.role}</Value>
            <Term>{labels.scale}</Term>
            <Value>{summary.scale}</Value>
            {summary.stack && summary.stack.length > 0 && (
              <>
                <Term>{labels.stack}</Term>
                <Value>
                  <Stack>{summary.stack.map((tech) => <Tech key={tech}>{tech}</Tech>)}</Stack>
                </Value>
              </>
            )}
          </Facts>
        )}
        {isNear && view === "architecture" && (
          <>
            <Architecture {...architecture} zone={zone} isShown={isOnScreen} isMoving={isOnScreen && settings.backdrop === "animated"} />
            <Note>{labels.glanceNote}</Note>
          </>
        )}
        {isNear && view === "flow" && (
          <>
            {wireframe && <Wireframe {...wireframe} labels={labels} />}
            {wireframe && <Note>{labels.sketchNote}</Note>}
            {journeys.length > 0 && <GroupHeading>{labels.journeys}</GroupHeading>}
            {journeys.length > 0 && <JourneyList journeys={journeys} />}
          </>
        )}
      </Body>
    </Figure>
  );
};

const List = tw.div`flex flex-col gap-[22px] lg:gap-[30px]`;

const Showcase = styled.div(() => [
  tw`flex flex-col gap-[14px]`,
  css`
    @media (min-width: 1024px) {
      margin-left: ${BLEED};
      margin-right: ${BLEED};
    }
  `,
]);

const TabList = styled.div(() => [
  tw`flex flex-row gap-[6px] overflow-x-auto pb-[4px]`,
  css`
    scrollbar-width: thin;
  `,
]);

const Tab = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`relative flex-shrink-0 h-[36px] px-[14px] cursor-pointer text-xs md:text-sm font-semibold whitespace-nowrap rounded-[2px]
     border-[1px] border-solid`,
  isOn ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[#ccc] bg-[#0d0d0d] border-[#262626]`,
  css`
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--accent);
      color: ${isOn ? "#101010" : "#fff"};
    }
  `,
]);

// Each universe switches tabs its own way. AI: a neural beam scans the new drawing in. Web3: blocks
// confirm one after another in a diagonal wave. Casino: the drawing is dealt and flipped like a card.
// Game world: a retro pixel dissolve. Engineering: a terminal refreshes top to bottom. The quick view just
// fades; reduced motion just swaps.
type SwitchEffect = "beam" | "blocks" | "deal" | "pixels" | "scan" | "fade";

const ZONE_EFFECTS: Record<ZoneId, SwitchEffect> = {
  ai: "beam",
  chain: "blocks",
  casino: "deal",
  mmo: "pixels",
  matrix: "scan",
};

const SWITCH_MS = 650;

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

const Stage = styled.div(({ effect }: { effect: SwitchEffect | null }) => [
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

const BLOCK_GRID = { columns: 8, rows: 4 };
const PIXEL_GRID = { columns: 16, rows: 8 };

const SwitchOverlay: FC<{ effect: SwitchEffect }> = ({ effect }) => {
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

interface BlueprintListProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
}

// Several blueprints become a showcase: one tab each, and an animated switch between them, so a section
// shows one system at a time instead of a long stack.
const BlueprintTabs: FC<BlueprintListProps> = ({ blueprints, labels }: BlueprintListProps) => {
  const { settings } = useLensStateHook();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasSwitched, setHasSwitched] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const current = blueprints[active];

  const open = (index: number) => {
    if (index === active) {
      return;
    }

    setDirection(index > active ? 1 : -1);
    setActive(index);
    setHasSwitched(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];

    if (!step) {
      return;
    }

    event.preventDefault();

    const next = (active + step + blueprints.length) % blueprints.length;

    open(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };

  const effect: SwitchEffect | null = !hasSwitched ? null : settings.transitions === "none" ? "fade" : ZONE_EFFECTS[current.zone];
  const stageStyle = {
    "--from-left": direction === 1 ? "0" : "100%",
    "--from-right": direction === 1 ? "100%" : "0",
    "--beam-from": direction === 1 ? "0" : "calc(100cqw - 3px)",
    "--beam-to": direction === 1 ? "calc(100cqw - 3px)" : "0",
    "containerType": "inline-size",
  } as React.CSSProperties;

  return (
    <Showcase>
      <TabList ref={tabsRef} role="tablist" aria-label={labels.showcase}>
        {blueprints.map((blueprint, index) => (
          <Tab
            key={blueprint.id}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            isOn={index === active}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => open(index)}
            onKeyDown={onKeyDown}
          >
            {blueprint.tab ?? blueprint.title}
          </Tab>
        ))}
      </TabList>
      <Stage
        key={current.id}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        effect={effect}
        style={stageStyle}
      >
        {effect && <SwitchOverlay effect={effect} />}
        <Blueprint {...current} labels={labels} isBleed={false} isEager={hasSwitched} />
      </Stage>
    </Showcase>
  );
};

export const BlueprintList: FC<BlueprintListProps> = ({ blueprints, labels }: BlueprintListProps) => (
  blueprints.length > 1 ? <BlueprintTabs blueprints={blueprints} labels={labels} /> : (
    <List>
      {blueprints.map((blueprint) => <Blueprint key={blueprint.id} {...blueprint} labels={labels} />)}
    </List>
  )
);

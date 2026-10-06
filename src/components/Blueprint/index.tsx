import { FC, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { Architecture } from "@/components/Blueprint/Architecture";
import { Wireframe } from "@/components/Blueprint/Wireframe";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Lens } from "@/config/lenses";
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

// The switch between tabs: the new blueprint is drawn in from the side it was reached from, behind a beam
// in the zone's colour, like a scanner passing over it. Quick views just fade; reduced motion just swaps.
const Stage = styled.div(({ isImmersive }: { isImmersive: boolean }) => [
  tw`relative`,
  isImmersive ? css`
    & > figure {
      animation: ${wipeIn} 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both;
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
      animation: ${beam} 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
  ` : css`
    & > figure {
      animation: ${fade} 0.3s ease both;
    }
  `,
  css`
    @media (prefers-reduced-motion: reduce) {
      & > figure,
      &::after {
        animation: none;
      }

      &::after {
        display: none;
      }
    }
  `,
]);

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
        isImmersive={hasSwitched && settings.transitions !== "none"}
        style={stageStyle}
      >
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

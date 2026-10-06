import { FC, useEffect, useId, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Architecture } from "@/components/Blueprint/Architecture";
import { Wireframe } from "@/components/Blueprint/Wireframe";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { Lens } from "@/config/lenses";
import useInView from "@/hooks/useInView";
import { Blueprint as BlueprintContent, BlueprintJourney, BlueprintLabels } from "@/types/blueprints";

interface BlueprintProps extends BlueprintContent {
  labels: BlueprintLabels;
}

type View = "overview" | "architecture" | "flow";

const Figure = tw.figure`m-0 flex flex-col gap-[16px] p-[18px] md:p-[24px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

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
export const Blueprint: FC<BlueprintProps> = ({ zone, title, caption, summary, architecture, wireframe, journeys = [], labels }: BlueprintProps) => {
  const { lens, settings } = useLensStateHook();
  const hasFlow = Boolean(wireframe) || journeys.length > 0;
  const [view, setView] = useState<View>(() => defaultView(lens, hasFlow));
  const figureRef = useRef<HTMLElement>(null);
  const isOnScreen = useInView(figureRef, { once: false, threshold: 0 });
  // Drawings are built as they come within a screen or so of view, not during hydration: they add hundreds
  // of elements the first paint does not need.
  const isNear = useInView(figureRef, { once: true, threshold: 0, rootMargin: "100% 0px" });
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
    <Figure ref={figureRef}>
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
            <Term>{labels.stack}</Term>
            <Value>
              <Stack>{summary.stack.map((tech) => <Tech key={tech}>{tech}</Tech>)}</Stack>
            </Value>
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

interface BlueprintListProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
}

export const BlueprintList: FC<BlueprintListProps> = ({ blueprints, labels }: BlueprintListProps) => (
  <List>
    {blueprints.map((blueprint) => <Blueprint key={blueprint.id} {...blueprint} labels={labels} />)}
  </List>
);

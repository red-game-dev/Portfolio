import { FC, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { HistoryEntry } from "@/components/History/HistoryEntry";
import { Panel, PanelTitle } from "@/components/Panel";
import { Text } from "@/components/Text";
import useScrollProgressVar from "@/hooks/useScrollProgressVar";
import { toMonthIndex } from "@/packages/insights/career";
import { HistoryLabels } from "@/types/history";
import { Resume } from "@/types/resume";
import { SectionIntros } from "@/types/sections-intros";

interface HistoryProps {
  intro: SectionIntros;
  experience: Resume[];
  education: Resume[];
  labels: HistoryLabels;
}

interface GraphProps {
  hasVentureLane: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

const Legend = tw.div`flex flex-row flex-wrap gap-[16px] mb-[18px] text-xs text-[#999]`;

const LegendItem = styled.span(({ isVenture }: { isVenture: boolean }) => [
  tw`inline-flex flex-row items-center gap-[6px]`,
  css`
    &::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 9999px;
      background: ${isVenture ? "#ffc45c" : "var(--accent)"};
    }
  `,
]);

// The lanes are drawn once for the whole list, and their fill follows the scroll through a CSS variable.
const Graph = styled.ol(({ hasVentureLane }: GraphProps) => [
  tw`relative m-0 p-0 flex flex-col gap-[16px]`,
  css`
    --lane-main: 14px;
    --lane-venture: 38px;

    @media (min-width: 768px) {
      --lane-main: 18px;
      --lane-venture: 50px;
    }

    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      left: calc(var(--lane-main) - 1px);
      background: #1E1E1E;
      box-shadow: ${hasVentureLane ? "calc(var(--lane-venture) - var(--lane-main)) 0 0 #1E1E1E" : "none"};
    }

    &::after {
      background: linear-gradient(to bottom, var(--accent), var(--accent-muted));
      box-shadow: ${hasVentureLane ? "calc(var(--lane-venture) - var(--lane-main)) 0 0 #ffc45c" : "none"};
      transform-origin: top;
      transform: scaleY(var(--scroll-progress, 0));
    }

    @media (prefers-reduced-motion: reduce) {
      &::after {
        transform: none;
      }
    }
  `,
]);

const byStartDescending = (entries: Resume[]) => [...entries].sort((first, second) => toMonthIndex(second.from) - toMonthIndex(first.from));

// My history as a commit graph: employment on the main lane, the companies I founded on a branch beside it.
export const History: FC<HistoryProps> = ({ intro, experience, education, labels }: HistoryProps) => {
  const experienceRef = useRef<HTMLOListElement>(null);
  const educationRef = useRef<HTMLOListElement>(null);
  const sortedExperience = useMemo(() => byStartDescending(experience), [experience]);
  const sortedEducation = useMemo(() => byStartDescending(education), [education]);

  useScrollProgressVar(experienceRef);
  useScrollProgressVar(educationRef);

  return (
    <Section id="section-history">
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Panels>
        <Panel>
          <PanelTitle>{labels.experience}</PanelTitle>
          <Legend aria-hidden="true">
            <LegendItem isVenture={false}>{labels.main}</LegendItem>
            <LegendItem isVenture={true}>{labels.ventures}</LegendItem>
          </Legend>
          <Graph ref={experienceRef} hasVentureLane={true}>
            {sortedExperience.map((entry) => (
              <HistoryEntry key={entry.title} {...entry} labels={labels} hasVentureLane={true} />
            ))}
          </Graph>
        </Panel>
        <Panel>
          <PanelTitle>{labels.education}</PanelTitle>
          <Graph ref={educationRef} hasVentureLane={false}>
            {sortedEducation.map((entry) => (
              <HistoryEntry key={entry.title} {...entry} labels={labels} hasVentureLane={false} />
            ))}
          </Graph>
        </Panel>
      </Panels>
    </Section>
  );
};

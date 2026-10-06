import { FC, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { HistoryEntry } from "@/components/History/HistoryEntry";
import { Panel, PanelTitle } from "@/components/Panel";
import { SectionText } from "@/components/Text/SectionText";
import { industryAnchor } from "@/config/sections";
import useIndustryFromHash from "@/hooks/useIndustryFromHash";
import useScrollProgressVar from "@/hooks/useScrollProgressVar";
import { toMonthIndex } from "@/packages/insights/career";
import { IndustryLink } from "@/types/headline";
import { HistoryLabels } from "@/types/history";
import { Resume } from "@/types/resume";
import { SectionIntros } from "@/types/sections-intros";

interface HistoryProps {
  intro: SectionIntros;
  experience: Resume[];
  education: Resume[];
  labels: HistoryLabels;
  industries: IndustryLink[];
}

interface GraphProps {
  hasVentureLane: boolean;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

// Targets for #industry-* links, so the first screen's industry chips land here.
const Anchor = tw.span`absolute top-0 left-0`;

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[25px] lg:mt-[35px] text-sm text-[#999]`;

const Chip = styled.button(({ isSelected }: { isSelected: boolean }) => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full border-[1px] border-solid border-[var(--accent-muted)] bg-[#1d1d1d]
     text-[var(--accent)]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease;
  `,
  isSelected && tw`bg-[var(--accent)] text-[#101010]`,
]);

const Matches = tw.p`m-0 mt-[12px] text-sm text-[#bbb]`;

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
export const History: FC<HistoryProps> = ({ intro, experience, education, labels, industries }: HistoryProps) => {
  const experienceRef = useRef<HTMLOListElement>(null);
  const educationRef = useRef<HTMLOListElement>(null);
  const sortedExperience = useMemo(() => byStartDescending(experience), [experience]);
  const sortedEducation = useMemo(() => byStartDescending(education), [education]);

  const industryKeys = useMemo(() => industries.map((link) => link.industry), [industries]);
  const [industry, setIndustry] = useIndustryFromHash(industryKeys);
  const selected = industries.find((link) => link.industry === industry);
  const matches = industry ? sortedExperience.filter((entry) => entry.industries?.includes(industry)).length : 0;

  useScrollProgressVar(experienceRef);
  useScrollProgressVar(educationRef);

  return (
    <Section id="section-history">
      {industries.map((link) => (
        <Anchor key={link.industry} id={industryAnchor(link.industry)} aria-hidden="true" />
      ))}
      <SectionText intro={intro} />
      <Filters role="group" aria-label={labels.industryFilter}>
        <span>{labels.industryFilter}</span>
        <Chip type="button" isSelected={industry === null} aria-pressed={industry === null} onClick={() => setIndustry(null)}>
          {labels.allIndustries}
        </Chip>
        {industries.map((link) => (
          <Chip
            key={link.industry}
            type="button"
            isSelected={industry === link.industry}
            aria-pressed={industry === link.industry}
            onClick={() => setIndustry(link.industry)}
          >
            {link.label}
          </Chip>
        ))}
      </Filters>
      {selected && (
        <Matches aria-live="polite">{labels.industryMatches.replace("{count}", String(matches)).replace("{industry}", selected.label)}</Matches>
      )}
      <Panels>
        <Panel>
          <PanelTitle>{labels.experience}</PanelTitle>
          <Legend aria-hidden="true">
            <LegendItem isVenture={false}>{labels.main}</LegendItem>
            <LegendItem isVenture={true}>{labels.ventures}</LegendItem>
          </Legend>
          <Graph ref={experienceRef} hasVentureLane={true}>
            {sortedExperience.map((entry) => (
              <HistoryEntry
                key={entry.title}
                {...entry}
                labels={labels}
                hasVentureLane={true}
                isDimmed={industry !== null && !entry.industries?.includes(industry)}
              />
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

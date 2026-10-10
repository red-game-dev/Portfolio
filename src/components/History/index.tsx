import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { FilterChip } from "@/components/Controls";
import { branchToCheckout, byStartDescending, industryMatches, matchesPerBranch, splitBranches } from "@/components/History/branches";
import { VENTURE_COLOUR } from "@/components/History/config";
import { HistoryEntry } from "@/components/History/HistoryEntry";
import { Panel, PanelTitle } from "@/components/Panel";
import { Anchor, Section } from "@/components/Section";
import { Tab, TabCount, TabList } from "@/components/Tabs";
import { SectionText } from "@/components/Text/SectionText";
import { industryAnchor, SECTION_IDS } from "@/config/sections";
import useIndustryFromHash from "@/hooks/useIndustryFromHash";
import useScrollProgressVar from "@/hooks/useScrollProgressVar";
import useTabs from "@/hooks/useTabs";
import { fill } from "@/packages/text/format";
import { fadeIn } from "@/styles/keyframes";
import { honourHidden, media, noAnimationWhenReduced } from "@/styles/mixins";
import { IndustryLink } from "@/types/headline";
import { HistoryLabels } from "@/types/history";
import { Resume } from "@/types/resume";
import { SectionIntros } from "@/types/sections-intros";

interface HistoryProps {
  intro: SectionIntros;
  experience: Resume[];
  // Every startup founded or co-founded, so the founded branch can account for the ones not listed.
  foundedTotal: number;
  education: Resume[];
  labels: HistoryLabels;
  industries: IndustryLink[];
}

interface GraphProps {
  // Work runs on the main lane in the zone's colour; what I founded is a branch of its own, in gold.
  lane: "main" | "venture";
}

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[25px] lg:mt-[35px] text-sm text-[#999]`;

const Matches = tw.p`m-0 mt-[12px] text-sm text-[#bbb]`;

// The lanes are drawn once for the whole list, and their fill follows the scroll through a CSS variable.

const Graph = styled.ol(({ lane }: GraphProps) => [
  tw`relative m-0 p-0 flex flex-col gap-[16px]`,
  css`
    --lane-main: 14px;
    --lane-venture: 38px;

    ${media.md} {
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
    }

    &::after {
      background: ${lane === "venture" ? `linear-gradient(to bottom, ${VENTURE_COLOUR}, #5c4a26)` : "linear-gradient(to bottom, var(--accent), var(--accent-muted))"};
      transform-origin: top;
      transform: scaleY(var(--scroll-progress, 0));
    }

    ${media.reducedMotion} {
      &::after {
        transform: none;
      }
    }
  `,
]);

const type = (characters: number) => keyframes`
  from { width: 0; }
  to { width: ${characters}ch; }
`;

// What a branch switch prints: the command typed out, then git's answer.
const Checkout = tw.div`flex flex-col gap-[2px] mt-[14px] mb-[16px] px-[12px] py-[10px] text-xs bg-[#0a0f0c] border-[1px] border-solid
border-[#1E1E1E] font-mono`;

const Command = styled.span(({ characters }: { characters: number }) => [
  tw`block overflow-hidden whitespace-nowrap text-white`,
  css`
    width: ${characters}ch;
    animation: ${type(characters)} 0.42s steps(${characters}, end) both;

    &::before {
      content: "$ ";
      color: var(--accent);
    }

    ${noAnimationWhenReduced}
  `,
]);

const Answer = styled.span(() => [
  tw`block text-[#8a948f]`,
  css`
    animation: ${fadeIn} 0.2s ease 0.45s both;

    ${noAnimationWhenReduced}
  `,
]);

// No end opacity: each commit settles at its own, so entries outside the chosen industry stay faded.
const commitIn = keyframes`
  from { opacity: 0; transform: translateX(-18px); }
  to { transform: none; }
`;

// After a switch, the branch's commits land one after another, top to bottom, once the checkout has run.
// A panel coming back from hidden replays this on its own, with no remount.
const BranchPanel = styled.div(({ isCheckedOut }: { isCheckedOut: boolean }) => [
  honourHidden,
  isCheckedOut && css`
    & > ol > li {
      animation: ${commitIn} 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) backwards;
    }

    ${Array.from({ length: 16 }, (_, index) => `& > ol > li:nth-of-type(${index + 1}) { animation-delay: ${480 + index * 70}ms; }`).join("\n")}

    ${media.reducedMotion} {
      & > ol > li {
        animation: none;
      }
    }
  `,
]);

const TabBar = tw.div`mt-[6px]`;

// The branch's last commit: the startups not listed one by one, drawn as a dashed node.
const More = styled.li(({ isDimmed }: { isDimmed: boolean }) => [
  tw`relative list-none pl-[36px] md:pl-[44px]`,
  css`
    transition: opacity 0.3s ease;
  `,
  isDimmed && tw`opacity-30`,
]);

const MoreNode = styled.span(() => [
  tw`absolute top-[14px] w-[13px] h-[13px] rounded-full bg-[#101010]`,
  css`
    left: calc(var(--lane-main) - 6px);
    border: 2px dashed ${VENTURE_COLOUR};
  `,
]);

const MoreText = tw.p`m-0 p-[14px] text-sm text-[#bbb] bg-[#0d0d0d] border-[1px] border-dashed border-[#5c4a26]`;

// My history as a commit graph, with two branches to check out: the work I was hired for, and the companies I
// founded or co-founded. Switching runs a git checkout and the branch's commits land one by one.
export const History: FC<HistoryProps> = ({ intro, experience, foundedTotal, education, labels, industries }: HistoryProps) => {
  const workRef = useRef<HTMLOListElement>(null);
  const foundedRef = useRef<HTMLOListElement>(null);
  const educationRef = useRef<HTMLOListElement>(null);
  const branches = useMemo(() => {
    const names = {
      main: { label: labels.workTab, branch: labels.workBranch, ref: workRef },
      venture: { label: labels.foundedTab, branch: labels.foundedBranch, ref: foundedRef },
    };

    return splitBranches(experience, foundedTotal).map((branch) => ({ ...branch, ...names[branch.lane] }));
  }, [experience, foundedTotal, labels]);
  const [checkouts, setCheckouts] = useState(0);
  const onSelect = useCallback(() => setCheckouts((count) => count + 1), []);
  const { active, select, listProps, tabProps, panelProps } = useTabs({ count: branches.length, onSelect });
  const sortedEducation = useMemo(() => byStartDescending(education), [education]);

  const industryKeys = useMemo(() => industries.map((link) => link.industry), [industries]);
  const [industry, setIndustry] = useIndustryFromHash(industryKeys);
  const selected = industries.find((link) => link.industry === industry);
  const matches = industryMatches(branches, industry);
  const branchMatches = matchesPerBranch(branches, industry);

  // An industry with nothing on the open branch checks out the branch that has it.
  useEffect(() => {
    const target = industry ? branchToCheckout(branchMatches, active) : null;

    if (target !== null) {
      select(target);
    }
    // Only when the industry changes: the reader may still pick the empty branch afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  useScrollProgressVar(workRef);
  useScrollProgressVar(foundedRef);
  useScrollProgressVar(educationRef);

  return (
    <Section id={SECTION_IDS.history}>
      {industries.map((link) => (
        <Anchor key={link.industry} id={industryAnchor(link.industry)} aria-hidden="true" />
      ))}
      <SectionText intro={intro} />
      <Filters role="group" aria-label={labels.industryFilter}>
        <span>{labels.industryFilter}</span>
        <FilterChip type="button" isSelected={industry === null} aria-pressed={industry === null} onClick={() => setIndustry(null)}>
          {labels.allIndustries}
        </FilterChip>
        {industries.map((link) => (
          <FilterChip
            key={link.industry}
            type="button"
            isSelected={industry === link.industry}
            aria-pressed={industry === link.industry}
            onClick={() => setIndustry(link.industry)}
          >
            {link.label}
          </FilterChip>
        ))}
      </Filters>
      {selected && (
        <Matches aria-live="polite">{fill(labels.industryMatches, { count: matches, industry: selected.label })}</Matches>
      )}
      <Panels>
        <Panel>
          <PanelTitle>{labels.experience}</PanelTitle>
          <TabBar>
            <TabList {...listProps} aria-label={labels.tabsLabel} data-scroll-x>
              {branches.map((branch, index) => (
                <Tab key={branch.branch} {...tabProps(index)} isOn={index === active}>
                  <FontAwesomeIcon icon={faCodeBranch} aria-hidden="true" />
                  {branch.label}
                  <TabCount isOn={index === active} aria-hidden="true">{branchMatches[index]}</TabCount>
                </Tab>
              ))}
            </TabList>
          </TabBar>
          {checkouts > 0 && (
            <Checkout key={checkouts} aria-hidden="true">
              <Command characters={fill(labels.checkout, { branch: branches[active].branch }).length + 2}>
                {fill(labels.checkout, { branch: branches[active].branch })}
              </Command>
              <Answer>{fill(labels.switched, { branch: branches[active].branch })}</Answer>
            </Checkout>
          )}
          {branches.map((branch, index) => (
            <BranchPanel key={branch.branch} {...panelProps(index)} isCheckedOut={checkouts > 0}>
              <Graph ref={branch.ref} lane={branch.lane}>
                {branch.entries.map((entry) => (
                  <HistoryEntry
                    key={entry.title}
                    {...entry}
                    labels={labels}
                    hasVentureLane={false}
                    isDimmed={industry !== null && !entry.industries?.includes(industry)}
                  />
                ))}
                {branch.unlisted > 0 && (
                  <More isDimmed={industry !== null}>
                    <MoreNode aria-hidden="true" />
                    <MoreText>{fill(labels.moreVentures, { count: branch.unlisted })}</MoreText>
                  </More>
                )}
              </Graph>
            </BranchPanel>
          ))}
        </Panel>
        <Panel>
          <PanelTitle>{labels.education}</PanelTitle>
          <Graph ref={educationRef} lane="main">
            {sortedEducation.map((entry) => (
              <HistoryEntry key={entry.title} {...entry} labels={labels} hasVentureLane={false} />
            ))}
          </Graph>
        </Panel>
      </Panels>
    </Section>
  );
};

import { FC, useEffect, useMemo, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Panel } from "@/components/Panel";
import { RegionDialog } from "@/components/Projects/RegionDialog";
import { WorldMap } from "@/components/Projects/WorldMap";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS } from "@/config/sections";
import { toMonthIndex } from "@/packages/insights/career";
import { BlueprintLabels } from "@/types/blueprints";
import { ProjectDetail, ProjectKind, ProjectMapContent } from "@/types/projects";
import { SectionIntros } from "@/types/sections-intros";

interface ProjectsProps {
  projects: ProjectDetail[];
  intro: SectionIntros;
  content: ProjectMapContent;
  blueprintLabels: BlueprintLabels;
}

const KIND_ORDER: ProjectKind[] = ["game", "web3", "product", "community", "archive"];

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for the "Games and real time" link on the first screen, which also filters the map to games.
const Anchor = tw.span`absolute top-0 left-0`;

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[25px] lg:mt-[35px] mb-[18px] text-sm text-[#999]`;

const Chip = styled.button(({ isSelected }: { isSelected: boolean }) => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full border-[1px] border-solid border-[var(--accent-muted)] bg-[#1d1d1d]
     text-[var(--accent)]`,
  css`
    transition: color 0.2s ease, background-color 0.2s ease;
  `,
  isSelected && tw`bg-[var(--accent)] text-[#101010]`,
]);

// Projects as a world map: one region per project in the order I explored them, each opening a map
// screen with what I built there.
export const Projects: FC<ProjectsProps> = ({ projects, intro, content, blueprintLabels }: ProjectsProps) => {
  const { labels } = content;
  const [activeKind, setActiveKind] = useState<ProjectKind | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ordered = useMemo(() => [...projects].sort((first, second) => toMonthIndex(first.from) - toMonthIndex(second.from)), [projects]);
  const kinds = KIND_ORDER.filter((kind) => ordered.some((project) => project.kind === kind));

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === `#${ROLE_ANCHORS.games}`) {
        setActiveKind("game");
      }
    };

    sync();
    window.addEventListener("hashchange", sync);

    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const period = (project: ProjectDetail) => labels.period.replace("{from}", project.from).replace("{to}", project.to ?? labels.present);
  const describe = (project: ProjectDetail) => `${project.title}, ${project.category}, ${period(project)}`;
  const open = openIndex === null ? null : ordered[openIndex];

  return (
    <Section id="section-projects">
      <Anchor id={ROLE_ANCHORS.games} aria-hidden="true" />
      <SectionText intro={intro} />
      <Filters role="group" aria-label={labels.filter}>
        <span>{labels.filter}</span>
        <Chip type="button" isSelected={activeKind === null} aria-pressed={activeKind === null} onClick={() => setActiveKind(null)}>
          {labels.all}
        </Chip>
        {kinds.map((kind) => (
          <Chip key={kind} type="button" isSelected={activeKind === kind} aria-pressed={activeKind === kind} onClick={() => setActiveKind(kind)}>
            {content.kinds[kind]}
          </Chip>
        ))}
      </Filters>
      <Panel>
        <WorldMap projects={ordered} activeKind={activeKind} describe={describe} hint={labels.hint} onOpen={setOpenIndex} />
      </Panel>
      <RegionDialog
        project={open}
        blueprintLabels={blueprintLabels}
        previous={openIndex !== null && openIndex > 0 ? ordered[openIndex - 1] : null}
        next={openIndex !== null && openIndex < ordered.length - 1 ? ordered[openIndex + 1] : null}
        content={content}
        period={open ? period(open) : ""}
        onClose={() => setOpenIndex(null)}
        onPrevious={() => setOpenIndex((index) => (index === null ? null : Math.max(0, index - 1)))}
        onNext={() => setOpenIndex((index) => (index === null ? null : Math.min(ordered.length - 1, index + 1)))}
      />
    </Section>
  );
};

import { FC, useEffect, useMemo, useState } from "react";

import tw from "twin.macro";

import { FilterChip } from "@/components/Controls";
import { Panel } from "@/components/Panel";
import { LazyRegionDialog } from "@/components/Projects/LazyRegionDialog";
import { WorldMap } from "@/components/Projects/WorldMap";
import { Anchor, Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { ROLE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { useHashValue } from "@/hooks/useHashState";
import { formatPeriod, toMonthIndex } from "@/packages/insights/career";
import { ProjectDetail, ProjectKind, ProjectMapContent } from "@/types/projects";
import { SectionIntros } from "@/types/sections-intros";

interface ProjectsProps {
  projects: ProjectDetail[];
  intro: SectionIntros;
  content: ProjectMapContent;
}

const KIND_ORDER: ProjectKind[] = ["game", "web3", "product", "community", "archive"];

const Filters = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[25px] lg:mt-[35px] mb-[18px] text-sm text-[#999]`;

const kindForHash = (hash: string): ProjectKind | null => (hash === `#${ROLE_ANCHORS.games}` ? "game" : null);

// Projects as a world map: one region per project in the order I explored them, each opening a map
// screen with what I built there.
export const Projects: FC<ProjectsProps> = ({ projects, intro, content }: ProjectsProps) => {
  const { labels } = content;
  const [activeKind, setActiveKind] = useState<ProjectKind | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ordered = useMemo(() => [...projects].sort((first, second) => toMonthIndex(first.from) - toMonthIndex(second.from)), [projects]);
  const kinds = KIND_ORDER.filter((kind) => ordered.some((project) => project.kind === kind));

  // The first screen's games link opens the map on games.
  const linkedKind = useHashValue(kindForHash);

  useEffect(() => {
    if (linkedKind) {
      setActiveKind(linkedKind);
    }
  }, [linkedKind]);

  const period = (project: ProjectDetail) => formatPeriod(project, labels.period, labels.present);
  const describe = (project: ProjectDetail) => `${project.title}, ${project.category}, ${period(project)}`;
  const open = openIndex === null ? null : ordered[openIndex];

  return (
    <Section id={SECTION_IDS.projects}>
      <Anchor id={ROLE_ANCHORS.games} aria-hidden="true" />
      <SectionText intro={intro} />
      <Filters role="group" aria-label={labels.filter}>
        <span>{labels.filter}</span>
        <FilterChip type="button" isSelected={activeKind === null} aria-pressed={activeKind === null} onClick={() => setActiveKind(null)}>
          {labels.all}
        </FilterChip>
        {kinds.map((kind) => (
          <FilterChip key={kind} type="button" isSelected={activeKind === kind} aria-pressed={activeKind === kind} onClick={() => setActiveKind(kind)}>
            {content.kinds[kind]}
          </FilterChip>
        ))}
      </Filters>
      <Panel>
        <WorldMap projects={ordered} activeKind={activeKind} describe={describe} hint={labels.hint} undatedLabel={labels.undated} onOpen={setOpenIndex} />
      </Panel>
      {open && (
        <LazyRegionDialog
        project={open}

        previous={openIndex !== null && openIndex > 0 ? ordered[openIndex - 1] : null}
        next={openIndex !== null && openIndex < ordered.length - 1 ? ordered[openIndex + 1] : null}
        content={content}
        period={open ? period(open) : ""}
        onClose={() => setOpenIndex(null)}
        onPrevious={() => setOpenIndex((index) => (index === null ? null : Math.max(0, index - 1)))}
        onNext={() => setOpenIndex((index) => (index === null ? null : Math.min(ordered.length - 1, index + 1)))}
        />
      )}
    </Section>
  );
};

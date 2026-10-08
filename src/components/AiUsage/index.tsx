import { FC } from "react";

import tw from "twin.macro";

import { AgentPipeline } from "@/components/AiUsage/AgentPipeline";
import { RepoTimelapse } from "@/components/AiUsage/RepoTimelapse";
import { SubjectAreas } from "@/components/AiUsage/SubjectAreas";
import { TaskMix } from "@/components/AiUsage/TaskMix";
import { Timeline } from "@/components/AiUsage/Timeline";
import { TokenBudget } from "@/components/AiUsage/TokenBudget";
import { UsageScreen } from "@/components/AiUsage/UsageScreen";
import { BlueprintSection } from "@/components/Blueprint";
import { Anchor, Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { PortfolioAiUsageView } from "@/types/ai-usage";
import { BlueprintSection as BlueprintSectionId } from "@/types/blueprints";
import { TimelapseContent } from "@/types/timelapse";

interface AiUsageProps extends PortfolioAiUsageView {
  // Which drawings this section shows, fetched as it nears the screen.
  blueprintSection: BlueprintSectionId;
  timelapse: TimelapseContent;
}

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

export const AiUsage: FC<AiUsageProps> = ({ intro, screen, mix, budget, areas, agents, timeline, blueprintSection, timelapse }: AiUsageProps) => (
  <Section id={SECTION_IDS.aiUsage}>
    <Anchor id={AUDIENCE_ANCHORS.ai} aria-hidden="true" />
    <SectionText intro={intro} />
    <UsageScreen {...screen} />
    <Panels>
      <TaskMix {...mix} />
      <TokenBudget {...budget} />
      <SubjectAreas {...areas} />
      <AgentPipeline {...agents} />
      <BlueprintSection section={blueprintSection} />
      <Timeline {...timeline} />
      <RepoTimelapse {...timelapse} />
    </Panels>
  </Section>
);

import { FC } from "react";

import tw from "twin.macro";

import { AgentPipeline } from "@/components/AiUsage/AgentPipeline";
import { SubjectAreas } from "@/components/AiUsage/SubjectAreas";
import { TaskMix } from "@/components/AiUsage/TaskMix";
import { Timeline } from "@/components/AiUsage/Timeline";
import { TokenBudget } from "@/components/AiUsage/TokenBudget";
import { UsageScreen } from "@/components/AiUsage/UsageScreen";
import { BlueprintList } from "@/components/Blueprint";
import { SectionText } from "@/components/Text/SectionText";
import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { PortfolioAiUsageView } from "@/types/ai-usage";
import { Blueprint, BlueprintLabels } from "@/types/blueprints";

interface AiUsageProps extends PortfolioAiUsageView {
  blueprints: Blueprint[];
  blueprintLabels: BlueprintLabels;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for #for-ai-engineering, so an AI engineering application can link straight here.
const Anchor = tw.span`absolute top-0 left-0`;

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

export const AiUsage: FC<AiUsageProps> = ({ intro, screen, mix, budget, areas, agents, timeline, blueprints, blueprintLabels }: AiUsageProps) => (
  <Section id={SECTION_IDS.aiUsage}>
    <Anchor id={AUDIENCE_ANCHORS.ai} aria-hidden="true" />
    <SectionText intro={intro} />
    <UsageScreen {...screen} />
    <Panels>
      <TaskMix {...mix} />
      <TokenBudget {...budget} />
      <SubjectAreas {...areas} />
      <AgentPipeline {...agents} />
      <BlueprintList blueprints={blueprints} labels={blueprintLabels} />
      <Timeline {...timeline} />
    </Panels>
  </Section>
);

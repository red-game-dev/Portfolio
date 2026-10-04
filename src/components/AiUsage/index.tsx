import { FC } from "react";

import tw from "twin.macro";

import { AgentPipeline } from "@/components/AiUsage/AgentPipeline";
import { SubjectAreas } from "@/components/AiUsage/SubjectAreas";
import { TaskMix } from "@/components/AiUsage/TaskMix";
import { Timeline } from "@/components/AiUsage/Timeline";
import { UsageScreen } from "@/components/AiUsage/UsageScreen";
import { Text } from "@/components/Text";
import { AUDIENCE_ANCHORS, SECTION_IDS } from "@/config/sections";
import { PortfolioAiUsageView } from "@/types/ai-usage";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

// Target for #for-ai-engineering, so an AI engineering application can link straight here.
const Anchor = tw.span`absolute top-0 left-0`;

const Panels = tw.div`flex flex-col gap-[25px] lg:gap-[35px] mt-[25px] lg:mt-[35px]`;

export const AiUsage: FC<PortfolioAiUsageView> = ({ intro, screen, mix, areas, agents, timeline }: PortfolioAiUsageView) => (
  <Section id={SECTION_IDS.aiUsage}>
    <Anchor id={AUDIENCE_ANCHORS.ai} aria-hidden="true" />
    <Text title={intro.title} paragraphs={intro.description} isSection={false} />
    <UsageScreen {...screen} />
    <Panels>
      <TaskMix {...mix} />
      <SubjectAreas {...areas} />
      <AgentPipeline {...agents} />
      <Timeline {...timeline} />
    </Panels>
  </Section>
);

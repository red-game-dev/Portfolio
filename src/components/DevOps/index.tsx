import { FC } from "react";

import tw, { styled } from "twin.macro";

import { BlueprintSection } from "@/components/Blueprint";
import { Planner } from "@/components/DevOps/Planner";
import { Lead } from "@/components/DevOps/styles";
import { Panel, PanelTitle } from "@/components/Panel";
import { Section } from "@/components/Section";
import { SectionText } from "@/components/Text/SectionText";
import { SECTION_IDS } from "@/config/sections";
import { squareBullet } from "@/styles/mixins";
import { DevOpsContent } from "@/types/devops";
import { SectionIntros } from "@/types/sections-intros";

interface DevOpsProps {
  intro: SectionIntros;
  content: DevOpsContent;
}

const Stack = tw.div`flex flex-col gap-[18px]`;

const Hosts = tw.ul`list-none m-0 p-0 grid gap-[14px] md:grid-cols-2 xl:grid-cols-3`;

const Host = styled.li`
  ${tw`flex flex-col gap-[10px] min-w-0 p-[16px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`}

  border-top: 2px solid var(--accent);
`;

const HostName = tw.h4`m-0 text-base font-semibold text-white`;

const Kind = tw.p`m-0 mt-[-6px] text-xs uppercase tracking-wide text-[var(--accent)]`;

const Facts = tw.dl`m-0 flex flex-col gap-[8px]`;

const Fact = tw.div`flex flex-col gap-[2px]`;

const Term = tw.dt`text-xs font-semibold text-[#ddd]`;

const Detail = tw.dd`m-0 text-sm text-[#aaa]`;

const Columns = tw.div`grid gap-[18px] lg:grid-cols-2 items-start`;

const Points = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px] text-sm text-[#aaa]`;

const Point = styled.li`
  ${tw`relative pl-[14px]`}
  ${squareBullet({ size: 5 })}
`;

const Topics = tw.div`grid gap-[14px] md:grid-cols-2`;

const Topic = styled.article`
  ${tw`flex flex-col gap-[10px] min-w-0 p-[16px] bg-[#0d0d0d] border-[1px] border-solid border-[var(--accent-muted)]`}
`;

const TopicTitle = tw.h4`m-0 text-base font-semibold text-white`;

// The DevOps universe's section: where a product should run, worked out from four answers, and a console that ships
// each universe to that plan; then the hosts I run on and when each pays, the stacks I set up from scratch and the CLI
// that moved them, drawn as systems (its blueprints, loaded as the section nears), and how I run them in production. It
// holds no words of its own.
export const DevOps: FC<DevOpsProps> = ({ intro, content }: DevOpsProps) => (
  <Section id={SECTION_IDS.devops}>
    <SectionText intro={intro} />
    <Stack>
      <Planner content={content} />
      <Panel>
        <PanelTitle>{content.hosts.title}</PanelTitle>
        <Lead>{content.hosts.intro}</Lead>
        <Hosts>
          {content.hosts.items.map((host) => (
            <Host key={host.id}>
              <HostName>{host.name}</HostName>
              <Kind>{host.kind}</Kind>
              <Facts>
                <Fact>
                  <Term>{content.hosts.labels.reach}</Term>
                  <Detail>{host.reach}</Detail>
                </Fact>
                <Fact>
                  <Term>{content.hosts.labels.stops}</Term>
                  <Detail>{host.stops}</Detail>
                </Fact>
                <Fact>
                  <Term>{content.hosts.labels.cost}</Term>
                  <Detail>{host.cost}</Detail>
                </Fact>
              </Facts>
            </Host>
          ))}
        </Hosts>
      </Panel>
      <Columns>
        <Panel>
          <PanelTitle>{content.scratch.title}</PanelTitle>
          <Points>
            {content.scratch.points.map((point) => (
              <Point key={point}>{point}</Point>
            ))}
          </Points>
        </Panel>
        <Panel>
          <PanelTitle>{content.cli.title}</PanelTitle>
          <Points>
            {content.cli.points.map((point) => (
              <Point key={point}>{point}</Point>
            ))}
          </Points>
        </Panel>
      </Columns>
      <BlueprintSection section="devops" />
      <Panel>
        <PanelTitle>{content.practice.title}</PanelTitle>
        <Lead>{content.practice.intro}</Lead>
        <Topics>
          {content.practice.topics.map((topic) => (
            <Topic key={topic.id}>
              <TopicTitle>{topic.title}</TopicTitle>
              <Points>
                {topic.points.map((line) => (
                  <Point key={line}>{line}</Point>
                ))}
              </Points>
            </Topic>
          ))}
        </Topics>
      </Panel>
    </Stack>
  </Section>
);

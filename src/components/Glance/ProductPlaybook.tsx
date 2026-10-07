import { FC, useMemo } from "react";

import {
  Block,
  BlockNote,
  BlockTitle,
  Columns,
  Description,
  Heading,
  Milestone,
  Road,
  Row,
  Rows,
  Sheet,
  StageExample,
  StageName,
  Stat,
  StatLabel,
  Stats,
  StatValue,
  Strong,
  Title,
} from "@/components/Glance/styles";
import { GlanceProps } from "@/components/Glance/types";
import { startYear } from "@/components/Glance/utils";
import { splitTitle } from "@/packages/insights/career";
import { fill } from "@/packages/text/format";
import { createRosterLevels } from "@/services/roster";
import { ProductPlaybookContent } from "@/types/lens";

interface ProductPlaybookProps extends Omit<GlanceProps, "content"> {
  content: ProductPlaybookContent;
}

// For product readers: what was founded, who it reached, the product levels held, how it made money and
// grew, and how a product gets run, each backed by something on the page.
export const ProductPlaybook: FC<ProductPlaybookProps> = ({ content, details, experience, roster }: ProductPlaybookProps) => {
  const rosterLevels = useMemo(() => createRosterLevels(roster), [roster]);
  const stats = content.proofValues.flatMap((value) => details.proof.filter((figure) => figure.value === value));
  const levels = content.levelClasses.flatMap((characterClass) => {
    const character = roster.characters.find((candidate) => candidate.characterClass === characterClass);

    if (!character) {
      return [];
    }

    return [{ name: characterClass, text: fill(content.levelFormat, { level: rosterLevels.level(character), since: rosterLevels.since(character) }) }];
  });
  const ventures = experience.filter((entry) => entry.isVenture).sort((first, second) => startYear(first.from) - startYear(second.from));

  return (
    <Sheet>
      <Heading>
        <Title>{content.title}</Title>
        <Description>{content.description}</Description>
      </Heading>
      <Stats>
        {stats.map((figure) => (
          <Stat key={figure.value}>
            <StatValue>{figure.value}</StatValue>
            <StatLabel>{figure.label}</StatLabel>
          </Stat>
        ))}
      </Stats>
      <Columns>
        <Block>
          <BlockTitle>{content.levelsLabel}</BlockTitle>
          <Rows>
            {levels.map((level) => (
              <Row key={level.name}>
                <Strong>{level.name}</Strong>
                {`: ${level.text}`}
              </Row>
            ))}
          </Rows>
        </Block>
        <Block>
          <BlockTitle>{content.venturesLabel}</BlockTitle>
          <BlockNote>{content.venturesNote}</BlockNote>
          <Rows>
            {ventures.map((entry) => {
              const { role, place } = splitTitle(entry.title);

              return (
                <Row key={entry.title}>
                  <Strong>{place}</Strong>
                  {`: ${entry.ventureRole ?? role}, ${entry.period?.toLowerCase() ?? fill(content.ventureSince, { year: startYear(entry.from) })}`}
                </Row>
              );
            })}
          </Rows>
        </Block>
        <Block>
          <BlockTitle>{content.monetisationLabel}</BlockTitle>
          <Rows>{content.monetisation.map((item) => <Row key={item}>{item}</Row>)}</Rows>
        </Block>
        <Block>
          <BlockTitle>{content.growthLabel}</BlockTitle>
          <Rows>{content.growth.map((item) => <Row key={item}>{item}</Row>)}</Rows>
        </Block>
      </Columns>
      <Block>
        <BlockTitle>{content.stagesLabel}</BlockTitle>
        <Road>
          {content.stages.map((stage) => (
            <Milestone key={stage.name}>
              <StageName>{stage.name}</StageName>
              <StageExample>{stage.example}</StageExample>
            </Milestone>
          ))}
        </Road>
      </Block>
    </Sheet>
  );
};

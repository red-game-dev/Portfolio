import { FC, useMemo } from "react";

import tw, { css, styled } from "twin.macro";

import { faEnvelope, faFileArrowDown } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { pickSkillYears, splitTitle, startYear } from "@/components/Glance/utils";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { TenureCalculator } from "@/packages/insights/career";
import { ForgeStation } from "@/services/skills";
import { Detail } from "@/types/details";
import { Headline } from "@/types/headline";
import { LensContent, ProductPlaybookContent, RecruiterGlanceContent } from "@/types/lens";
import { Resume } from "@/types/resume";
import { Roster } from "@/types/roster";

interface GlanceProps {
  content: LensContent["glance"];
  details: Detail;
  headline: Headline;
  experience: Resume[];
  roster: Roster;
  stations: ForgeStation[];
  cvUrl: string;
}

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Sheet = tw.div`flex flex-col gap-[26px] p-[22px] md:p-[32px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Header = tw.div`flex flex-col md:flex-row md:items-end justify-between gap-[16px]`;

const Heading = tw.div`flex flex-col gap-[8px] max-w-[60ch]`;

const Title = tw.h2`m-0 text-2xl font-semibold text-white`;

const Description = tw.p`m-0 text-sm md:text-base text-[#aaa]`;

const Actions = tw.div`flex flex-row flex-wrap gap-[10px]`;

const Action = styled.a(({ isPrimary }: { isPrimary: boolean }) => [
  tw`inline-flex flex-row items-center gap-[8px] h-[38px] px-[14px] text-sm font-semibold no-underline rounded-[2px] border-[1px] border-solid`,
  isPrimary ? tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]` : tw`text-[var(--accent)] bg-transparent border-[var(--accent-muted)]`,
  css`
    transition: filter 0.2s ease;

    &:hover,
    &:focus-visible {
      filter: brightness(1.12);
    }
  `,
]);

// A label beside its values on wide screens, above them on narrow ones.
const Facts = tw.dl`grid gap-x-[24px] gap-y-[18px] m-0 md:grid-cols-[180px 1fr]`;

const Term = tw.dt`text-xs font-semibold text-[#8a8a8a] md:pt-[6px]`;

const Value = tw.dd`m-0 flex flex-col gap-[10px] min-w-0`;

const Chips = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-[6px]`;

const Chip = tw.li`inline-flex flex-row items-baseline gap-[6px] text-sm leading-none text-white bg-[#161616] rounded-[2px] py-[7px] px-[10px]
border-[1px] border-solid border-[#262626]`;

const Years = tw.span`text-xs text-[var(--accent)]`;

const GroupLabel = tw.span`block text-xs text-[#8a8a8a] mb-[6px]`;

const Roles = tw.ol`list-none m-0 p-0 flex flex-col`;

const RoleRow = styled.li(() => [
  tw`grid gap-x-[16px] gap-y-[2px] py-[9px] md:grid-cols-[1fr auto]`,
  css`
    border-top: 1px solid #1e1e1e;

    &:first-child {
      border-top: 0;
      padding-top: 2px;
    }
  `,
]);

const RoleName = tw.span`text-sm text-white`;

const RolePlace = tw.span`text-sm text-[#9a9a9a]`;

const RoleRange = tw.span`text-xs text-[#8a8a8a] md:text-right md:row-span-2 md:self-center`;

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), template);

interface RecruiterGlanceProps extends Omit<GlanceProps, "content"> {
  content: RecruiterGlanceContent;
}

// For a shortlist: roles, years, work rights, the stack with years, industries and recent roles, with the
// CV one click away. Plain text, no effects.
const RecruiterGlance: FC<RecruiterGlanceProps> = ({ content, details, headline, experience, roster, stations, cvUrl }: RecruiterGlanceProps) => {
  const calculator = useMemo(() => new TenureCalculator(roster.asOf), [roster.asOf]);
  const levels = content.roleClasses.flatMap((characterClass) => {
    const character = roster.characters.find((candidate) => candidate.characterClass === characterClass);

    return character ? [{ name: characterClass, years: calculator.years(character.tenures) }] : [];
  });
  const groups = content.skillGroups.map((group) => ({ label: group.label, skills: pickSkillYears(stations, group.names) }));

  return (
    <Sheet>
      <Header>
        <Heading>
          <Title>{content.title}</Title>
          <Description>{content.description}</Description>
        </Heading>
        <Actions>
          <Action isPrimary href={cvUrl} download>
            <FontAwesomeIcon icon={faFileArrowDown} aria-hidden="true" />
            {headline.cvLabel}
          </Action>
          <Action isPrimary={false} href={`mailto:${details.email}`}>
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
            {headline.emailLabel}
          </Action>
        </Actions>
      </Header>
      <Facts>
        <Term>{content.rolesLabel}</Term>
        <Value>
          <Chips>{content.roles.map((role) => <Chip key={role}>{role}</Chip>)}</Chips>
        </Value>
        <Term>{content.yearsLabel}</Term>
        <Value>
          <Chips>
            {levels.map((level) => (
              <Chip key={level.name}>
                {level.name}
                <Years>{fill(content.yearsFormat, { years: level.years })}</Years>
              </Chip>
            ))}
          </Chips>
        </Value>
        <Term>{content.workLabel}</Term>
        <Value>
          <Chips>
            {details.facts.map((fact) => <Chip key={fact}>{fact}</Chip>)}
          </Chips>
        </Value>
        <Term>{content.skillsLabel}</Term>
        <Value>
          {groups.map((group) => (
            <div key={group.label}>
              <GroupLabel>{group.label}</GroupLabel>
              <Chips>
                {group.skills.map((skill) => (
                  <Chip key={skill.name}>
                    {skill.name}
                    <Years>{fill(content.yearsFormat, { years: skill.years })}</Years>
                  </Chip>
                ))}
              </Chips>
            </div>
          ))}
        </Value>
        <Term>{content.industriesLabel}</Term>
        <Value>
          <Chips>{headline.industries.map(({ industry, label }) => <Chip key={industry}>{label}</Chip>)}</Chips>
        </Value>
        <Term>{content.recentLabel}</Term>
        <Value>
          <Roles>
            {experience.slice(0, content.recentCount).map((entry) => {
              const { role, place } = splitTitle(entry.title);

              return (
                <RoleRow key={entry.title}>
                  <RoleName>{role}</RoleName>
                  <RoleRange>{fill(content.rangeFormat, { from: entry.from, to: entry.to ?? content.nowLabel })}</RoleRange>
                  <RolePlace>{place}</RolePlace>
                </RoleRow>
              );
            })}
          </Roles>
        </Value>
      </Facts>
    </Sheet>
  );
};

const Stats = tw.ul`list-none m-0 p-0 grid gap-[12px] sm:grid-cols-3`;

const Stat = tw.li`flex flex-col gap-[4px] p-[16px] bg-[#111] border-[1px] border-solid border-[#222]`;

const StatValue = tw.span`text-3xl font-semibold text-[var(--accent)] leading-none`;

const StatLabel = tw.span`text-sm text-[#bbb]`;

const Columns = tw.div`grid gap-[22px] md:grid-cols-2`;

const Block = tw.section`flex flex-col gap-[10px]`;

const BlockTitle = tw.h3`m-0 text-sm font-semibold text-white`;

const Rows = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px]`;

const Row = styled.li(() => [
  tw`relative pl-[16px] text-sm text-[#bbb]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 6px;
      height: 6px;
      background: var(--accent);
    }
  `,
]);

const Strong = tw.strong`text-white font-semibold`;

const BlockNote = tw.p`m-0 text-xs text-[#9a9a9a]`;

const Road = tw.ol`relative list-none m-0 p-0 grid gap-[18px] md:grid-cols-4 md:gap-[14px]`;

const Milestone = styled.li(() => [
  tw`relative flex flex-col gap-[6px] pl-[22px] md:pl-0 md:pt-[24px]`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      width: 10px;
      height: 10px;
      transform: rotate(45deg);
      background: var(--accent);
    }

    @media (min-width: 768px) {
      &::before {
        top: 0;
      }

      &::after {
        content: "";
        position: absolute;
        left: 18px;
        right: 0;
        top: 4px;
        height: 1px;
        background: var(--accent-muted);
      }

      &:last-child::after {
        display: none;
      }
    }
  `,
]);

const StageName = tw.span`text-base font-semibold text-white`;

const StageExample = tw.span`text-sm text-[#aaa]`;

interface ProductPlaybookProps extends Omit<GlanceProps, "content"> {
  content: ProductPlaybookContent;
}

// For product readers: what was founded, who it reached, the product levels held, how it made money and
// grew, and how a product gets run, each backed by something on the page.
const ProductPlaybook: FC<ProductPlaybookProps> = ({ content, details, experience, roster }: ProductPlaybookProps) => {
  const calculator = useMemo(() => new TenureCalculator(roster.asOf), [roster.asOf]);
  const stats = content.proofValues.flatMap((value) => details.proof.filter((figure) => figure.value === value));
  const levels = content.levelClasses.flatMap((characterClass) => {
    const character = roster.characters.find((candidate) => candidate.characterClass === characterClass);

    if (!character) {
      return [];
    }

    const level = Math.max(1, calculator.years(character.tenures));

    return [{ name: characterClass, text: fill(content.levelFormat, { level, since: calculator.since(character.tenures) }) }];
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
                  {`: ${entry.ventureRole ?? role}, ${fill(content.ventureSince, { year: startYear(entry.from) })}`}
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

// The view's own first panel, right after the cover: a fact sheet for recruiters, a product playbook for
// product readers. Engineers go straight into the full page.
export const Glance: FC<GlanceProps> = ({ content, ...rest }: GlanceProps) => {
  const { lens } = useLensStateHook();

  if (lens === "engineer") {
    return null;
  }

  return (
    <Section id="section-glance">
      {lens === "recruiter" ? <RecruiterGlance content={content.recruiter} {...rest} /> : <ProductPlaybook content={content.product} {...rest} />}
    </Section>
  );
};

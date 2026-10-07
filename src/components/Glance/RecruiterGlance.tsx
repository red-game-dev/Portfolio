import { FC, useMemo } from "react";

import { faEnvelope, faFileArrowDown } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  Action,
  Actions,
  Chip,
  Chips,
  Description,
  Facts,
  GroupLabel,
  Header,
  Heading,
  RoleName,
  RolePlace,
  RoleRange,
  RoleRow,
  Roles,
  Sheet,
  Term,
  Title,
  Value,
  Years,
} from "@/components/Glance/styles";
import { GlanceProps } from "@/components/Glance/types";
import { pickSkillYears } from "@/components/Glance/utils";
import { formatPeriod, splitTitle } from "@/packages/insights/career";
import { fill } from "@/packages/text/format";
import { createRosterLevels } from "@/services/roster";
import { RecruiterGlanceContent } from "@/types/lens";

interface RecruiterGlanceProps extends Omit<GlanceProps, "content"> {
  content: RecruiterGlanceContent;
}

// For a shortlist: roles, years, work rights, the stack with years, industries and recent roles, with the
// CV one click away. Plain text, no effects.
export const RecruiterGlance: FC<RecruiterGlanceProps> = ({ content, details, headline, experience, roster, stations, cvUrl }: RecruiterGlanceProps) => {
  const rosterLevels = useMemo(() => createRosterLevels(roster), [roster]);
  const levels = content.roleClasses.flatMap((characterClass) => {
    const character = roster.characters.find((candidate) => candidate.characterClass === characterClass);

    return character ? [{ name: characterClass, years: rosterLevels.years(character) }] : [];
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
                  <RoleRange>{formatPeriod(entry, content.rangeFormat, content.nowLabel)}</RoleRange>
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

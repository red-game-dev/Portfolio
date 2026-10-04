import { FC } from "react";

import tw from "twin.macro";

import { Panel, PanelText, PanelTitle } from "@/components/AiUsage/styles";
import { TagGroups } from "@/components/TagGroups";
import { AiUsageAreas } from "@/packages/insights/ai-usage";

const GroupsContainer = tw.div`mt-[25px]`;

const Notes = tw.ul`list-none m-0 mt-[25px] p-0 flex flex-col gap-[6px] text-sm text-[#888]`;

// Volume bands with tags, not bars: the subjects overlap, so drawing them as shares would imply a
// whole that does not exist.
export const SubjectAreas: FC<AiUsageAreas> = ({ title, description, groups, notes }: AiUsageAreas) => (
  <Panel>
    <PanelTitle>{title}</PanelTitle>
    {description.map((paragraph, index) => (
      <PanelText key={index}>{paragraph}</PanelText>
    ))}
    <GroupsContainer>
      <TagGroups groups={groups} />
    </GroupsContainer>
    <Notes>
      {notes.map((note, index) => (
        <li key={index}>{note}</li>
      ))}
    </Notes>
  </Panel>
);

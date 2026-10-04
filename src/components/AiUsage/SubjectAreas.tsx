import { FC } from "react";

import tw from "twin.macro";

import { Panel, PanelText, PanelTitle } from "@/components/AiUsage/styles";
import { AiUsageAreas } from "@/packages/insights/ai-usage";

const Groups = tw.div`flex flex-col gap-[22px] mt-[25px]`;

const GroupLabel = tw.h4`m-[0 0 10px 0] text-sm font-medium text-[#999]`;

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-2`;

const Tag = tw.li`text-xs leading-none text-[#4bffa5] bg-[#1d1d1d] rounded-full py-[7px] px-[11px]
border-[1px] border-solid border-[#2f6b4d]`;

const Notes = tw.ul`list-none m-0 mt-[25px] p-0 flex flex-col gap-[6px] text-sm text-[#888]`;

// Volume bands with tags, not bars: the subjects overlap, so drawing them as shares would imply a
// whole that does not exist.
export const SubjectAreas: FC<AiUsageAreas> = ({ title, description, groups, notes }: AiUsageAreas) => (
  <Panel>
    <PanelTitle>{title}</PanelTitle>
    {description.map((paragraph, index) => (
      <PanelText key={index}>{paragraph}</PanelText>
    ))}
    <Groups>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <GroupLabel>{group.label}</GroupLabel>
          <Tags>
            {group.items.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Tags>
        </section>
      ))}
    </Groups>
    <Notes>
      {notes.map((note, index) => (
        <li key={index}>{note}</li>
      ))}
    </Notes>
  </Panel>
);

import { FC } from "react";

import tw, { styled } from "twin.macro";

interface TagGroup {
  label: string;
  items: string[];
}

interface TagGroupsProps {
  groups: TagGroup[];
  // Keeps the document outline right wherever the groups are placed.
  headingLevel?: "h3" | "h4";
  columns?: 1 | 2;
}

interface GroupsProps {
  columns: 1 | 2;
}

const Groups = styled.div(({ columns }: GroupsProps) => [
  tw`grid gap-[22px]`,
  columns === 2 && tw`lg:grid-cols-2 lg:gap-x-[35px]`,
]);

const GroupLabel = tw.h4`m-[0 0 10px 0] text-sm font-medium text-[#999]`;

const Tags = tw.ul`list-none m-0 p-0 flex flex-row flex-wrap gap-2`;

const Tag = tw.li`text-xs leading-none text-[#4bffa5] bg-[#1d1d1d] rounded-full py-[7px] px-[11px]
border-[1px] border-solid border-[#2f6b4d]`;

// Named groups of tags, for lists that are evidence rather than a rating: no bars, no percentages.
export const TagGroups: FC<TagGroupsProps> = ({ groups, headingLevel = "h4", columns = 1 }: TagGroupsProps) => (
  <Groups columns={columns}>
    {groups.map((group) => (
      <section key={group.label} aria-label={group.label}>
        <GroupLabel as={headingLevel}>{group.label}</GroupLabel>
        <Tags>
          {group.items.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </Tags>
      </section>
    ))}
  </Groups>
);

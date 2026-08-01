import { FC } from "react";

import tw, { styled } from "twin.macro";

import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

import { Text } from "@/components/Text";

interface BoxTileProps {
  title: string;
  subtitle?: string;
  activeSubtitle?: boolean;
  icon?: FontAwesomeIconProps["icon"];
  description?: string[] | string;
  bullets?: string[];
  tags?: string[];
  isFullBorder?: boolean;
  withRandomBorder?: boolean;
  isFullWidth?: boolean;
}

interface ItemContentProps {
  withRandomBorder?: boolean;
  isFullBorder?: boolean;
  isFullWidth?: boolean;
}

interface SubtitleProps {
  active?: boolean;
}

const Item = styled.div(({ withRandomBorder, isFullBorder, isFullWidth }: ItemContentProps) => [
  tw`w-full m-3 p-[20px] text-base bg-[#101010] rounded-lg border-[#4bffa5] border-dotted
  hover:animate-[border-transition 1s ease-out 0s infinite]
  `,
  !withRandomBorder && tw`border-l-[1px] border-b-[1px]`,
  withRandomBorder && tw`border-r-[1px] border-t-[1px]`,
  isFullBorder && tw`border-[0px] border-b-[1px]`,
  !isFullWidth && tw`lg:w-[45%]`
]);

const Icon = styled(FontAwesomeIcon)(() => [
  tw`text-xl text-[#4bffa5] font-normal text-center w-full 
hover:animate-[move-text 0.75s forwards, text-color 0.75s forwards, border-transition 1s ease-in-out 0s]`
]);

const ItemTitle = tw.div`text-lg m-[15px 0] text-[#eee] font-semibold text-center w-full`;

const ItemSubtitle = styled.div(({ active = false }: SubtitleProps) => [
  tw`relative m-[0 0 5px 0] inline-block text-xs text-[#999]`,
  active && tw`text-[#4bffa5] font-medium`
]);

const BulletList = tw.ul`list-[circle] text-sm pl-[20px] mt-[15px] mb-0 marker:text-[#4bffa5]`;

const BulletListItem = tw.li`text-[#bbb] mb-[6px] break-words`;

const TagList = tw.ul`list-none flex flex-row flex-wrap gap-2 p-0 mt-[15px] mb-0`;

const TagListItem = tw.li`text-xs leading-none text-[#4bffa5] bg-[#1d1d1d] rounded-full py-[6px] px-[10px]
border-[1px] border-solid border-[#2f6b4d]`;


export const BoxTile: FC<BoxTileProps> = ({
  isFullBorder, withRandomBorder, isFullWidth, title, subtitle,
  activeSubtitle, description, bullets, tags, icon
}: BoxTileProps) => (
  <Item withRandomBorder={withRandomBorder} isFullBorder={isFullBorder} isFullWidth={isFullWidth}>
    { subtitle && <ItemSubtitle active={activeSubtitle}>{ subtitle }</ItemSubtitle> }
    { icon && <Icon icon={icon} /> }
    <ItemTitle>{ title }</ItemTitle>
    {
      description && (
        <Text
          paragraphs={typeof description === "object" ? description : [description]}
          isSection={false}
        />
      )
    }
    {
      Boolean(bullets?.length) && (
        <BulletList>
          {bullets?.map((bullet: string, index: number) => (
            <BulletListItem key={`${bullet.replace(/\s/, "")}-${index}`}>
              {bullet}
            </BulletListItem>
          ))}
        </BulletList>
      )
    }
    {
      Boolean(tags?.length) && (
        <TagList>
          {tags?.map((tag: string, index: number) => (
            <TagListItem key={`${tag.replace(/\s/, "")}-${index}`}>
              {tag}
            </TagListItem>
          ))}
        </TagList>
      )
    }
  </Item>
);

import { FC } from "react";

import tw, { styled } from "twin.macro";

import { FontAwesomeIcon, FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { Text } from "@/components/Text";

interface BoxTileProps {
  title: string;
  subtitle?: string;
  activeSubtitle?: boolean;
  // A single result line shown under the title.
  highlight?: string;
  icon?: FontAwesomeIconProps["icon"];
  description?: string[] | string;
  bullets?: string[];
  tags?: string[];
  link?: string;
  linkLabel?: string;
  linkIcon?: FontAwesomeIconProps["icon"];
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
  tw`w-full m-3 p-[20px] text-base bg-[#101010] rounded-lg border-[var(--accent)] border-dotted
  hover:animate-[border-transition 1s ease-out 0s infinite]
  `,
  !withRandomBorder && tw`border-l-[1px] border-b-[1px]`,
  withRandomBorder && tw`border-r-[1px] border-t-[1px]`,
  isFullBorder && tw`border-[0px] border-b-[1px]`,
  !isFullWidth && tw`lg:w-[45%]`
]);

const Icon = styled(FontAwesomeIcon)(() => [
  tw`text-xl text-[var(--accent)] font-normal text-center w-full 
hover:animate-[move-text 0.75s forwards, text-color 0.75s forwards, border-transition 1s ease-in-out 0s]`
]);

const ItemTitle = tw.h3`text-lg m-[15px 0] text-[#eee] font-semibold text-center w-full`;

const ItemSubtitle = styled.div(({ active = false }: SubtitleProps) => [
  tw`relative m-[0 0 5px 0] inline-block text-xs text-[#999]`,
  active && tw`text-[var(--accent)] font-medium`
]);

const Highlight = tw.p`m-[0 0 12px 0] text-sm font-medium text-[var(--accent)] break-words`;

const BulletList = tw.ul`list-[circle] text-sm pl-[20px] mt-[15px] mb-0 marker:text-[var(--accent)]`;

const BulletListItem = tw.li`text-[#bbb] mb-[6px] break-words`;

const TagList = tw.ul`list-none flex flex-row flex-wrap gap-2 p-0 mt-[15px] mb-0`;

const TagListItem = tw.li`text-xs leading-none text-[var(--accent)] bg-[#1d1d1d] rounded-full py-[6px] px-[10px]
border-[1px] border-solid border-[var(--accent-muted)]`;

const CallToAction = styled(Link)(() => [
  tw`relative mt-[15px] bg-transparent font-medium border-2 cursor-pointer border-solid no-underline
     inline-flex flex-row items-center gap-2 align-middle text-center text-sm leading-9
     h-[44px] py-0 px-5 text-[var(--accent)] border-[#101010] border-r-[var(--accent)]
     hover:text-white hover:animate-[border-transition 1s ease-out 0s infinite]`,
]);

const CallToActionArrow = tw.span`text-base leading-none`;


export const BoxTile: FC<BoxTileProps> = ({
  isFullBorder, withRandomBorder, isFullWidth, title, subtitle,
  activeSubtitle, highlight, description, bullets, tags, icon, link, linkLabel, linkIcon
}: BoxTileProps) => (
  <Item withRandomBorder={withRandomBorder} isFullBorder={isFullBorder} isFullWidth={isFullWidth}>
    { subtitle && <ItemSubtitle active={activeSubtitle}>{ subtitle }</ItemSubtitle> }
    { icon && <Icon icon={icon} /> }
    <ItemTitle>{ title }</ItemTitle>
    { highlight && <Highlight>{ highlight }</Highlight> }
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
    {
      link && (
        <CallToAction href={link} target="_blank" aria-label={linkLabel || title}>
          { linkIcon && <FontAwesomeIcon icon={linkIcon} /> }
          { linkLabel }
          <CallToActionArrow aria-hidden="true">&rarr;</CallToActionArrow>
        </CallToAction>
      )
    }
  </Item>
);

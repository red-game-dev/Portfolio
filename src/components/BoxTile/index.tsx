import { FC } from "react";

import tw, { styled } from "twin.macro";

import { Text } from "@/components/Text";

interface BoxTileProps {
  title: string;
  subtitle?: string;
  activeSubtitle?: boolean;
  icon?: string;
  description?: string[] | string;
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

const Icon = tw.i`text-xl text-[#4bffa5] font-normal text-center w-full 
hover:animate-[move-text 0.75s forwards, text-color 0.75s forwards, border-transition 1s ease-in-out 0s]`;

const ItemTitle = tw.div`text-lg m-[15px 0] text-[#eee] font-semibold text-center w-full`;

const ItemSubtitle = styled.div(({ active = false }: SubtitleProps) => [
  tw`relative m-[0 0 5px 0] inline-block text-xs text-[#999]`,
  active && tw`text-[#4bffa5] font-medium`
]);


export const BoxTile: FC<BoxTileProps> = ({ isFullBorder, withRandomBorder, isFullWidth, title, subtitle, activeSubtitle, description, icon }: BoxTileProps) => (
  <Item withRandomBorder={withRandomBorder} isFullBorder={isFullBorder} isFullWidth={isFullWidth}>
    { subtitle && <ItemSubtitle active={activeSubtitle}>{ subtitle }</ItemSubtitle> }
    { icon && <Icon className={icon} /> }
    <ItemTitle>{ title }</ItemTitle>
    {
      description && (
        <Text
          paragraphs={typeof description === "object" ? description : [description]}
          isSection={false}
        />
      )
    }
  </Item>
);

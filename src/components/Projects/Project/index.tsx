import { FC, useCallback } from "react";

import tw, { styled } from "twin.macro";

import Image from "next/image";

import { useModalStateHook } from "@/components/Modal/hooks/useModalStateHook";

interface ProjectProps {
  image: string;
  title: string;
  category: string;
  intro: string;
  responsabilities: string[];
  techStack: string[];
  link: string;
  from: string;
  to?: string;
  withRandomBorder?: boolean;
  isFullBorder?: boolean;
  isFullWidth?: boolean;
}

interface ItemProps {
  isFullWidth?: boolean;
}

interface OuterImageWrapperProps {
  withRandomBorder?: boolean;
  isFullBorder?: boolean;
}


const Item = styled.div(({ isFullWidth }: ItemProps) => [
  tw`relative text-center text-sm float-left w-full lg:w-1/2 m-0 p-[0 50px 100px 50px]
  `,
  isFullWidth && tw`lg:w-full`
]);

const OuterImageWrapper = styled.div(({ withRandomBorder, isFullBorder }: OuterImageWrapperProps) => [
  tw`relative overflow-hidden block text-xs rounded-lg border-[#4bffa5] border-double
  hover:animate-[border-transition 1s ease-out 0s infinite]
  `,
  !withRandomBorder && tw`border-b-[1px]`,
  withRandomBorder && tw`border-r-[1px]`,
  isFullBorder && tw`border-[0px] border-b-[1px]`,
]);

const OuterImageInfo = tw.span`absolute text-center w-full h-full block left-0 top-0`;

const OuterImageInfoIcon = tw.span`absolute top-[20px] right-[20px] text-base text-[#101010] font-normal
opacity-0 translate-y-[-15px] transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0s]
hover:opacity-60 hover:translate-y-0 hover:transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0.35s]`;

const OuterImageInfoDescription = tw.span`relative py-[10px] px-[20px] block opacity-0 
translate-y-[-15px] transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0s]
hover:top-0 hover:opacity-100 hover:translate-y-0 hover:transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0.35s]`;

const OuterImageInfoName = tw.span`block text-lg font-medium text-[#101010] break-words`;

const OuterImageInfoCategory = tw.span`block text-sm opacity-60 text-[#101010] m-0`;

const OuterImageContentWrapper = tw.span`table table-fixed h-full w-full relative left-0 top-0 z-[2]`;

const OuterImageDetail = tw.span`table-cell align-middle`;

export const Project: FC<ProjectProps> = ({
  title, category, intro, techStack, link, image,
  responsabilities, from, to,
  withRandomBorder, isFullBorder, isFullWidth
}: ProjectProps) => {
  const { setModal } = useModalStateHook();

  const onTapCallback = useCallback(() => {
    setModal({
      type: "project",
      title,
      intro,
      category,
      techStack,
      link,
      image,
      responsabilities,
      from,
      to
    });
  }, [category, from, image, intro, link, responsabilities, setModal, techStack, title, to]);

  return (
    <Item isFullWidth={isFullWidth}>
      <OuterImageWrapper
        withRandomBorder={withRandomBorder}
        isFullBorder={isFullBorder}>
        <div
          className="hover-animated"
        >
          <Image src={image} width="1000" height="300" alt="" />
          <OuterImageInfo className="circle" onClick={onTapCallback} >
            <OuterImageContentWrapper>
              <OuterImageDetail>
                <OuterImageInfoIcon className="fas fa-plus" />
                <OuterImageInfoDescription>
                  <OuterImageInfoCategory>{category}</OuterImageInfoCategory>
                  <OuterImageInfoName>{title}</OuterImageInfoName>
                </OuterImageInfoDescription>
              </OuterImageDetail>
            </OuterImageContentWrapper>
          </OuterImageInfo>
        </div>
      </OuterImageWrapper>
    </Item>
  );
};

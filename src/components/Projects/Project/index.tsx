import { FC, useCallback } from "react";

import tw, { css, styled } from "twin.macro";

import { Image } from "@/components/Image";
import { useModalStateHook } from "@/components/Modal/hooks/useModalStateHook";
import { ModalType } from "@/types/modal";
import { ProjectDetail } from "@/types/projects";

interface ProjectProps extends ProjectDetail {
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
  tw`relative text-center text-sm float-left w-full lg:w-1/2 m-0 p-[0 50px 100px 50px]`,
  isFullWidth && tw`lg:w-full`
]);

const OuterImageWrapper = styled.div(({ withRandomBorder, isFullBorder }: OuterImageWrapperProps) => [
  tw`relative overflow-hidden block text-xs rounded-lg border-[#4bffa5] border-double
  hover:animate-[border-transition 1s ease-out 0s infinite] hover:[& > img]:blur-sm`,
  !withRandomBorder && tw`border-b-[1px]`,
  withRandomBorder && tw`border-r-[1px]`,
  isFullBorder && tw`border-[0px] border-b-[1px]`,
]);

const OuterImageInfo = tw.div`absolute flex flex-col justify-center text-center w-full h-full left-0 top-0 z-[2]
opacity-0 translate-y-[-15px] transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0s]
hover:opacity-90 hover:translate-y-0 hover:transition-[all 0.7s cubic-bezier(0.165, 0.85, 0.45, 1) 0.35s]`;

const OuterImageInfoName = styled.span(() => [
  tw`w-full text-center text-lg font-medium text-white break-words`,
  css`
    text-shadow: -1px -2px 1px #4bffa5
  `
]);

const OuterImageInfoCategory = styled.span(() => [
  tw`w-full text-center text-sm opacity-60 text-gray-100 m-0`,
  css`
    text-shadow: -1px -2px 1px #4bffa5
  `
]);

export const Project: FC<ProjectProps> = ({
  title, category, intro, techStack, link, image,
  responsibilities, from, to,
  withRandomBorder, isFullBorder, isFullWidth
}: ProjectProps) => {
  const { setModal } = useModalStateHook();

  const onTapCallback = useCallback(() => {
    setModal({
      type: ModalType.PROJECT,
      title,
      intro,
      category,
      techStack,
      link,
      image,
      responsibilities,
      from,
      to
    });
  }, [category, from, image, intro, link, responsibilities, setModal, techStack, title, to]);

  return (
    <Item isFullWidth={isFullWidth}>
      <OuterImageWrapper
        withRandomBorder={withRandomBorder}
        isFullBorder={isFullBorder}>
          <Image src={image} width="1000" height="300" alt="" fallbackSrc={image.replace(".webp", ".jpg")} />
          <OuterImageInfo onClick={onTapCallback} >
            <OuterImageInfoCategory>{category}</OuterImageInfoCategory>
            <OuterImageInfoName>{title}</OuterImageInfoName>
          </OuterImageInfo>
      </OuterImageWrapper>
    </Item>
  );
};

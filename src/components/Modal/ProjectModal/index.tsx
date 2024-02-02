import { FC, useCallback } from "react";

import tw, { styled } from "twin.macro";

import Link from "next/link";

import { BoxTile } from "@/components/BoxTile";
import { Image } from "@/components/Image";
import { useModalStateHook } from "@/components/Modal/hooks/useModalStateHook";

const ButtonsWrapper = tw.div`mt-10`;

const CloseButton = styled.div(() => [
  tw`fixed right-2 bottom-0 lg:bottom-auto lg:top-10 bg-transparent font-medium border-2 cursor-pointer 
     border-solid no-underline overflow-hidden 
     inline-block align-middle text-center text-sm lg:text-base leading-9 lg:leading-9 bg-[#101010]`,
  tw`h-[44px] my-[0px] mx-[0.5rem] mb-[10px] text-[#4bffa5] border-[#101010] border-r-[#4bffa5]
     hover:text-white 
     before:content=['']
     before:absolute
     before:w-[0px]
     before:h-[0px]
     before:bg-[#3ebf69]
     hover:animate-[border-transition 1s ease-out 0s infinite]
     hover:before:transition-[5s all linear]
     hover:before:h-full
     hover:before:w-full`
]);

const ButtonLink = styled(Link)(() => [
  tw`relative bg-transparent font-medium border-2 cursor-pointer border-solid no-underline overflow-hidden 
     inline-block align-middle text-center text-sm lg:text-base leading-9 lg:leading-9`,
  tw`h-[44px] my-[0px] mx-[0.5rem] mb-[10px] text-[#4bffa5] border-[#101010] border-r-[#4bffa5]
     hover:text-white 
     before:content=['']
     before:absolute
     before:w-[0px]
     before:h-[0px]
     before:bg-[#3ebf69]
     hover:animate-[border-transition 1s ease-out 0s infinite]
     hover:before:transition-[5s all linear]
     hover:before:h-full
     hover:before:w-full`
]);

const InnerButtonText = tw.div`relative py-0 px-7 block z-[2] pointer-events-none`;

const AnimatedCircle = tw.div`absolute w-full h-full block`;

const PopupBoxImage = styled(Image)(() => [
  tw`h-[560px] w-full`,
]);

const PopupBoxContent = tw.div`p-8 lg:p-16`;

const PopupBoxTitle = tw.h4`py-4 font-medium text-xl text-white`;

const PopupBoxCategory = tw.div`m-[0 0 5px 0] block text-sm text-[#bbb]`;

const PopupBoxList = tw.ul`list-[circle]`;

const PopupBoxListItem = tw.li`text-[#4bffa5]`;

export const ProjectModal: FC = () => {
  const { modalContent, setModal } = useModalStateHook();
  const onClose = useCallback(() => {
    setModal(null);
  }, [setModal]);

  if (!modalContent) {
    return (<PopupBoxTitle>No Project content was set</PopupBoxTitle>);
  }

  return (
    <>
      <PopupBoxImage
        src={modalContent.image}
        fallbackSrc={modalContent.image.replace(".webp", ".jpg")}
        alt="Project Image"
        height={560}
        width={1000}
      />
      <CloseButton onClick={onClose}>
        <AnimatedCircle />
        <InnerButtonText>Close</InnerButtonText>
      </CloseButton>
      <PopupBoxContent>
        <PopupBoxCategory>{modalContent.category}</PopupBoxCategory>
        <BoxTile
          withRandomBorder={true}
          isFullBorder={false}
          subtitle={modalContent.to ? `${modalContent.from} - ${modalContent.to}` : `${modalContent.from} - Present`}
          isFullWidth={true}
          activeSubtitle={!modalContent.to}
          title={modalContent.title}
          description={modalContent.intro}
        />
        {
          modalContent?.responsibilities?.length > 0 && (
            <>
              <PopupBoxTitle>A walk through of responsibilities</PopupBoxTitle>
              <PopupBoxList>
                {modalContent?.responsibilities?.map((item: string, index: number) => (
                  <PopupBoxListItem key={`${item.replace(/\s/, "")}-${index}`}>
                    {item}
                  </PopupBoxListItem>
                ))}
              </PopupBoxList>
            </>
          )
        }
        {
          modalContent?.techStack?.length > 0 && (
            <>
              <PopupBoxTitle>Tech stack</PopupBoxTitle>
              <PopupBoxList>
                {modalContent?.techStack?.map((item: string, index: number) => (
                  <PopupBoxListItem key={`${item.replace(/\s/, "")}-${index}`}>
                    {item}
                  </PopupBoxListItem>
                ))}
              </PopupBoxList>
            </>
          )
        }
        <ButtonsWrapper>
          <ButtonLink href={modalContent.link} target="_blank" aria-label="View Project">
            <AnimatedCircle />
            <InnerButtonText>View Project</InnerButtonText>
          </ButtonLink>
        </ButtonsWrapper>
      </PopupBoxContent>
    </>
  );

};

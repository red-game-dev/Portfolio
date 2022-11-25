import tw, { styled } from "twin.macro";

import Link from "next/link";

import { Image } from "@/components/Image";
import TypingAnimation from "@/components/TypingAnimation";

interface CoverProps {
  image: string;
  intro: string;
  typingsTitles: string[];
}

const Introduction = styled.h1(() => [
  tw`m-0 absolute text-white break-words left-0 px-5 lg:pr-12 text-base 
    bottom-[30px]
    lg:text-lg lg:left-[calc(20% + 35px)] lg:bottom-[50px] lg:max-w-[560px]
    [& > strong]:text-[#4bffa5]`
]);

const Section = tw.div`relative overflow-hidden h-screen m-0 z-[7] `;

const Content = tw.div`absolute top-0 left-0 z-[2] table table w-full h-full align-middle text-justify`;

const TitleWrapper = tw.div`relative top-0 left-0 z-[2] table-fixed table-cell w-full h-full align-middle`;

const ScrollerLink = styled(Link)(() => [
  tw`absolute w-5 h-5 left-[47.4%] lg:left-[49.3%] z-[2] text-[#4bffa5] right-auto top-auto text-2xl text-center 
  animate-[mouse-anim-mobile 1s ease-out 0s infinite]
  lg:animate-[mouse-anim-desktop 1s ease-out 0s infinite]
  `
]);

const ScrollerIcon = tw.i`relative bottom-[10px]`;

const CoverContainer = tw.div`relative h-screen w-full`;

const CoverContent = tw.div`fixed h-full w-full left-0 top-0`;

const CoverImage = styled(Image)(() => [
  tw`blur-sm w-full h-full object-cover`
]);


const CoverBackgroundMask = tw.div`absolute top-0 left-0 w-full h-full opacity-40 z-[2] bg-[#101010]`;

const CoverBackgroundTexture = tw.div`absolute top-0 left-0 w-full h-full z-[2]`;

export const Cover = ({ intro, image, typingsTitles }: CoverProps) => (
    <Section id="section-started">
      <CoverContainer className="cover-container">
        <CoverContent>
          <CoverImage
            src={image}
            alt="Cover Photo"
            fallbackSrc={image.replace(".webp", ".jpg")}
            width={1000}
            height={1000}
            sizes="100vw"
          />
          <CoverBackgroundMask />
          <CoverBackgroundTexture id="grained_container" />
        </CoverContent>
      </CoverContainer>
      <Content>
          <Introduction dangerouslySetInnerHTML={{ __html: intro }} />
          <TitleWrapper>
            <TypingAnimation typingData={typingsTitles} />
          </TitleWrapper>
      </Content>
      <ScrollerLink href="#section-about" id="section-scroller-link" aria-hidden aria-label="Scroll to know me">
        <ScrollerIcon aria-hidden className="fas fa-chevron-down" />
      </ScrollerLink>
    </Section>
  );

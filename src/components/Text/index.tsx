import { FC } from "react";

import tw, { styled } from "twin.macro";

interface TextProps {
  title?: string;
  paragraphs: string[];
  isSection?: boolean;
}

interface SectionProps {
  isSection?: boolean;
}

interface ContentProps {
  isSection?: boolean;
}

const Section = styled.div(({ isSection }: SectionProps) => [
  tw`relative z-[6]`,
  isSection && tw`px-[30px] py-[50px] lg:px-[20%] lg:py-[70px]`
]);

const Content = styled.div(({ isSection }: ContentProps) => [
  tw`relative text-base ml-[-1px] p-[35px] bg-[#101010] border-solid border-[1px] border-b-[0px] border-[#1E1E1E]`,
  isSection && tw`border-solid border-l-[1px] border-b-[1px] border-l-[#4bffa5]`
]);

const Title = tw.h2`relative m-[0 0 30px 0] lg:m-[0 0 35px 0] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const ClearContainer = tw.div`clear-both`;

const Paragraph = styled.div(() => [
  tw`break-words w-full first:mt-0`,
]);

// Only standalone sections get an id, and titles are stripped to id-safe characters. The old
// fallback of slicing a paragraph produced ids containing spaces and "&", and collided whenever
// two nested tiles happened to start with the same ten characters.
const toTextSectionId = (title: string) => `section-${title.replace(/[^a-zA-Z0-9]/g, "")}`;

export const Text: FC<TextProps> = ({ title, paragraphs = [], isSection = true }: TextProps) => (
    <Section id={isSection && title ? toTextSectionId(title) : undefined} isSection={isSection}>
      <Content isSection={isSection}>
        { title && <Title>{ title }</Title> }
        {paragraphs.map((text: string, index: number) => (
          <Paragraph key={index}>{text}</Paragraph>
        ))}
        <ClearContainer />
      </Content>
    </Section>
  );

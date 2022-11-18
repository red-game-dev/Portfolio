import { FC } from "react";

import tw, { styled } from "twin.macro";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Content = tw.div`relative text-base ml-[-1px] p-[35px] bg-[#101010] border-solid border-l-[1px] border-[#4bffa5]`;

const Title = tw.div`relative m-[0 0 30px 0] lg:m-[0 0 35px 0] inline-block align-top text-2xl font-semibold	text-white transition-[all 0.3s ease 0s]`;

const ClearContainer = tw.div`clear-both`;

const Paragraph = styled.div(() => [
  tw`break-words first:mt-0`,
]);

interface TextProps {
  title?: string;
  paragraphs: string[];
}

export const Text: FC<TextProps> = ({ title, paragraphs = [] }: TextProps) => (
    <Section id="section-custom-text">
      <Content>
        { title && <Title>{ title }</Title> }
        <div>
          {paragraphs.map((text: string, index: number) => (
            <Paragraph key={index}>{text}</Paragraph>
          ))}
        </div>
        <ClearContainer />
      </Content>
    </Section>
  );

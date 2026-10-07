import { FC } from "react";

import tw from "twin.macro";

interface TextProps {
  title?: string;
  paragraphs: string[];
}

const Content = tw.div`relative z-[6] text-base ml-[-1px] p-[35px] bg-[#101010] border-solid border-[1px] border-b-[0px] border-[#1E1E1E]`;

const Title = tw.h2`relative m-[0 0 30px 0] lg:m-[0 0 35px 0] inline-block align-top text-2xl font-semibold text-white`;

const Paragraph = tw.div`break-words w-full first:mt-0`;

// A section's title and its paragraphs, on the panel every section opens with.
export const Text: FC<TextProps> = ({ title, paragraphs = [] }: TextProps) => (
  <Content>
    {title && <Title>{title}</Title>}
    {paragraphs.map((text, index) => (
      <Paragraph key={index}>{text}</Paragraph>
    ))}
  </Content>
);

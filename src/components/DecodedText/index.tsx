import { FC } from "react";

import tw from "twin.macro";

import { useDecodedText } from "@/components/DecodedText/hooks/useDecodedText";

interface DecodedTextProps {
  text: string;
  isActive: boolean;
  delay?: number;
}

const ReadableText = tw.span`sr-only`;

// Assistive tech and crawlers get the real text straight away; the bits are decoration.
export const DecodedText: FC<DecodedTextProps> = ({ text, isActive, delay = 0 }: DecodedTextProps) => {
  const visibleText = useDecodedText(text, isActive, delay);

  return (
    <>
      <ReadableText>{text}</ReadableText>
      <span aria-hidden="true">{visibleText}</span>
    </>
  );
};

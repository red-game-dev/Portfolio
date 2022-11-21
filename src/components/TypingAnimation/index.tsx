import { FC } from "react";

import tw from "twin.macro";

import { useType } from "@/components/TypingAnimation/hooks/useType";

const Subtitle = tw.h1`
  text-white text-6xl w-full m-auto text-center
  [& > span]:text-[#4bffa5] [& > span]:font-bold`;

interface TypingAnimationProps {
  typingData: string[];
}

const TypingAnimation: FC<TypingAnimationProps> = ({ typingData }: TypingAnimationProps) => {
  const currentLetters = useType(typingData);

  return (
    <>
      <Subtitle
        id="typing-title"
        dangerouslySetInnerHTML={{
          __html: currentLetters
        }}
      />
    </>
  );
};

export default TypingAnimation;

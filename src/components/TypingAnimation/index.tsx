import { FC } from "react";

import tw, { styled } from "twin.macro";

import { useType } from "@/components/TypingAnimation/hooks/useType";

const Subtitle = styled.h1(() => [
  tw`text-white text-6xl w-full m-auto text-center
     [& > span]:text-[#4bffa5] [& > span]:font-bold animate-[move-text 0.75s forwards, text-color 0.75s forwards, border-transition 1s ease-in-out 0s]`
]);

interface TypingAnimationProps {
  typingData: string[];
}

const TypingAnimation: FC<TypingAnimationProps> = ({ typingData }: TypingAnimationProps) => {
  const currentLetters = useType(typingData);

  return (
    <Subtitle
      id="typing-title"
      dangerouslySetInnerHTML={{
        __html: currentLetters
      }}
    />
  );
};

export default TypingAnimation;

import { useEffect, useRef, FC } from "react";

import tw from "twin.macro";
import Typed from "typed.js";

const Subtitle = tw.h1`
  text-white text-6xl w-full m-auto text-center
  [& > strong]:text-[#4bffa5]`;

interface TypingAnimationProps {
  typingData?: string[];
}

const TypingAnimation: FC<TypingAnimationProps> = ({ typingData }: TypingAnimationProps) => {
  const el = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const typed = new Typed(el.current as HTMLHeadingElement, {
      strings: typingData,
      typeSpeed: 100,
      backSpeed: 100,
      backDelay: 100,
      smartBackspace: true,
      loop: true,
      showCursor: false,
    });

    return () => {
      typed.destroy();
    };
  }, [typingData]);

return (
    <Subtitle
      id="typing-title"
      ref={el}
    ></Subtitle>
  );
};

export default TypingAnimation;

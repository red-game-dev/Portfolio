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
      strings: typingData
        ? typingData
        : [
            "Your next <strong>Frontend Engineer</strong>",
            "Your next <strong>Backend Engineer</strong>",
            "Your next <strong>Game Developer</strong>",
            "Your next <strong>App Developer</strong>",
            "Your next <strong>Software Engineer</strong>",
            "Your next <strong>Tech Consultant</strong>",
            "Your next <strong>Architect</strong>",
          ],
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
      id="subtitle"
      ref={el}
    ></Subtitle>
  );
};

export default TypingAnimation;
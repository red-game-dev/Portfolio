import { FC, Fragment, useMemo, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import { useTypewriter } from "@/components/TypingAnimation/hooks/useTypewriter";
import useInView from "@/hooks/useInView";
import { sumBy } from "@/packages/math/stats";
import { caretBlink } from "@/styles/keyframes";
import { hiddenWhenReduced } from "@/styles/mixins";

interface TypingAnimationProps {
  // Phrases with the highlighted part in <strong>, as written in the content.
  typingData: string[];
}

interface Segment {
  text: string;
  isStrong: boolean;
}

// "Your next <strong>Architect</strong>" into plain and highlighted runs of text.
const toSegments = (phrase: string): Segment[] => phrase
  .split(/(<strong>.*?<\/strong>)/)
  .filter(Boolean)
  .map((part) => ({ text: part.replace(/<\/?strong>/g, ""), isStrong: part.startsWith("<strong>") }));

// Every phrase sits in the same grid cell, invisible, so the block is always as tall as the longest one
// and the page never jumps as phrases change.
const Stack = styled.p(() => [
  tw`relative grid m-auto w-full text-center text-white font-normal text-[34px] leading-[1.15] sm:text-5xl md:text-6xl`,
  css`
    hyphens: none;
    overflow-wrap: normal;

    & > * {
      grid-area: 1 / 1;
    }
  `,
]);

const Sizer = tw.span`invisible`;

const Strong = tw.strong`font-bold text-[var(--accent)]`;

// Letters not typed yet keep their place, so every word lands where it will end up and never jumps a line.
const Pending = tw.span`invisible`;

const Caret = styled.span(() => [
  tw`inline-block w-[3px] h-[0.9em] ml-[2px] bg-[var(--accent)]`,
  css`
    vertical-align: -0.08em;
    animation: ${caretBlink} 0.9s steps(1) infinite;

    ${hiddenWhenReduced}
  `,
]);

const Screen = tw.span`sr-only`;

const renderSegments = (segments: Segment[], typed?: number, caret?: JSX.Element) => {
  let remaining = typed ?? Infinity;
  let isCaretPlaced = typed === undefined;

  return segments.map((segment, index) => {
    const shown = segment.text.slice(0, Math.max(0, remaining));
    const pending = segment.text.slice(shown.length);
    // The caret goes after the last typed letter, once, even when that letter ends a segment.
    const isCaretHere = !isCaretPlaced && remaining <= segment.text.length;
    const Wrap = segment.isStrong ? Strong : Fragment;

    isCaretPlaced = isCaretPlaced || isCaretHere;
    remaining -= segment.text.length;

    return (
      <Wrap key={index}>
        {shown}
        {isCaretHere && caret}
        {pending && <Pending>{pending}</Pending>}
      </Wrap>
    );
  });
};

// The rotating "Your next ..." line on the cover. The full phrase is laid out first and its letters are
// revealed in place, with a caret, so the line wraps once, at its final shape, on any screen.
const TypingAnimation: FC<TypingAnimationProps> = ({ typingData }: TypingAnimationProps) => {
  const phrases = useMemo(() => typingData.map(toSegments), [typingData]);
  const lengths = useMemo(() => phrases.map((segments) => sumBy(segments, (segment) => segment.text.length)), [phrases]);
  const stackRef = useRef<HTMLParagraphElement>(null);
  // Stops typing while the cover is scrolled away, and carries on from the same letter on the way back.
  const isOnScreen = useInView(stackRef, { once: false, threshold: 0 });
  const { index, typed } = useTypewriter(lengths, isOnScreen);
  const current = phrases[index] ?? [];
  // The same every keystroke, so React skips them while the visible line changes.
  const sizers = useMemo(() => phrases.map((segments, phrase) => (
    <Sizer key={phrase} aria-hidden="true">{renderSegments(segments)}</Sizer>
  )), [phrases]);
  const spoken = useMemo(() => phrases.map((segments) => segments.map((segment) => segment.text).join("")).join(". "), [phrases]);

  return (
    <Stack ref={stackRef} id="typing-title">
      {sizers}
      <span aria-hidden="true">{renderSegments(current, typed, <Caret />)}</span>
      <Screen>{spoken}</Screen>
    </Stack>
  );
};

export default TypingAnimation;

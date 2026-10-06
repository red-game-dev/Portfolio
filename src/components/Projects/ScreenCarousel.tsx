import { FC, KeyboardEvent, useCallback, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faChevronLeft, faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Image } from "@/components/Image";
import { ProjectScreen } from "@/types/projects";

interface ScreenCarouselProps {
  screens: ProjectScreen[];
  labels: {
    previous: string;
    next: string;
    // "{index}" and "{count}" are replaced.
    position: string;
  };
}

const Carousel = tw.section`flex flex-col gap-[10px]`;

const Viewport = tw.div`relative`;

// Native scroll snapping does the swiping on touch; the buttons and keys move it on desktop.
const Track = styled.ul(() => [
  tw`list-none m-0 p-0 flex flex-row overflow-x-auto`,
  css`
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
]);

const Slide = styled.li(() => [
  tw`flex flex-col gap-[8px] m-0 w-full flex-shrink-0`,
  css`
    scroll-snap-align: start;
  `,
]);

const Frame = styled.div(() => [
  tw`relative w-full overflow-hidden bg-[#111] border-[1px] border-solid border-[#222]`,
  css`
    aspect-ratio: 16 / 9;
  `,
]);

const Shot = styled(Image)(() => [tw`object-cover`]);

const Caption = tw.p`m-0 text-sm text-[#bbb]`;

const Arrow = styled.button(({ side }: { side: "left" | "right" }) => [
  tw`absolute top-1/2 z-[2] flex items-center justify-center w-[38px] h-[38px] cursor-pointer text-white rounded-full
     bg-[rgba(16, 16, 16, 0.78)] border-[1px] border-solid border-[#333] disabled:opacity-30 disabled:cursor-default`,
  side === "left" ? tw`left-[10px]` : tw`right-[10px]`,
  css`
    transform: translateY(-50%);
    transition: border-color 0.2s ease;

    &:hover:not(:disabled),
    &:focus-visible {
      border-color: var(--kind);
    }
  `,
]);

const Dots = tw.div`flex flex-row justify-center gap-[8px]`;

const Dot = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`w-[8px] h-[8px] p-0 cursor-pointer rounded-full border-0`,
  isOn ? tw`bg-[var(--kind)]` : tw`bg-[#3a3a3a]`,
]);

// Real screenshots, one at a time: swipe, the arrows, the dots or the arrow keys move between them.
export const ScreenCarousel: FC<ScreenCarouselProps> = ({ screens, labels }: ScreenCarouselProps) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const go = useCallback((next: number) => {
    const track = trackRef.current;
    const target = Math.max(0, Math.min(screens.length - 1, next));

    track?.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
    setIndex(target);
  }, [screens.length]);

  const onScroll = () => {
    const track = trackRef.current;

    if (track && track.clientWidth > 0) {
      setIndex(Math.round(track.scrollLeft / track.clientWidth));
    }
  };

  // The dialog moves between regions with the arrow keys; inside the carousel they move between shots.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

    if (step) {
      event.preventDefault();
      event.stopPropagation();
      go(index + step);
    }
  };

  const position = (at: number) => labels.position.replace("{index}", String(at + 1)).replace("{count}", String(screens.length));

  return (
    <Carousel onKeyDown={onKeyDown} aria-roledescription="carousel">
      <Viewport>
        <Track ref={trackRef} onScroll={onScroll}>
          {screens.map((screen, at) => (
            <Slide key={screen.image} aria-roledescription="slide" aria-label={position(at)}>
              <Frame>
                <Shot src={screen.image} alt={screen.alt} fallbackSrc={screen.image.replace(".webp", ".jpg")} fill sizes="(min-width: 920px) 880px, 100vw" />
              </Frame>
              <Caption>{screen.caption}</Caption>
            </Slide>
          ))}
        </Track>
        <Arrow type="button" side="left" aria-label={labels.previous} disabled={index === 0} onClick={() => go(index - 1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </Arrow>
        <Arrow type="button" side="right" aria-label={labels.next} disabled={index === screens.length - 1} onClick={() => go(index + 1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </Arrow>
      </Viewport>
      <Dots>
        {screens.map((screen, at) => (
          <Dot key={screen.image} type="button" isOn={at === index} aria-label={position(at)} aria-current={at === index} onClick={() => go(at)} />
        ))}
      </Dots>
    </Carousel>
  );
};

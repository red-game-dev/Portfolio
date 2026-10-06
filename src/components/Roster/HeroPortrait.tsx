import { FC, useEffect, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { createHeroModel, DEFAULT_HERO_CLASSES, HeroClass } from "@/packages/games/heroes";
import { RigActor, RigRenderer } from "@/packages/graphics/rig";

interface HeroPortraitProps {
  heroId: string;
}

// Every card shares one model and one sprite cache, so a class is painted once however many cards show it.
const MODEL = createHeroModel();
let renderer: RigRenderer<HeroClass> | null = null;

const sharedRenderer = () => {
  renderer = renderer ?? new RigRenderer(MODEL, { maxEntries: 128 });

  return renderer;
};

const Frame = styled.div(() => [
  tw`relative flex-shrink-0 w-[96px] md:w-[112px] overflow-hidden rounded-[6px] bg-[#0b0b0b] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    aspect-ratio: 200 / 240;
  `,
]);

const Canvas = tw.canvas`block w-full h-full`;

// The character as an MMO hero: the class's armour, headgear and weapon on the same player, breathing,
// blinking and glowing while the card is on screen.
export const HeroPortrait: FC<HeroPortraitProps> = ({ heroId }: HeroPortraitProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actorRef = useRef<RigActor<HeroClass> | null>(null);
  const isOnScreen = useInView(frameRef, { once: false, threshold: 0.1 });

  useEffect(() => {
    const frame = frameRef.current;
    const context = canvasRef.current?.getContext("2d");

    if (!frame || !context) {
      return;
    }

    const actor = new RigActor(context, { model: MODEL, skins: DEFAULT_HERO_CLASSES, renderer: sharedRenderer() });
    const resize = () => actor.resize(frame.clientWidth, window.devicePixelRatio || 1);
    const observer = new ResizeObserver(resize);

    actorRef.current = actor;
    actor.setSkinById(heroId);
    resize();
    observer.observe(frame);

    return () => {
      observer.disconnect();
      actor.stop();
      actorRef.current = null;
    };
  }, [heroId]);

  useEffect(() => {
    const actor = actorRef.current;

    if (isOnScreen && !prefersReducedMotion()) {
      actor?.start();
    } else {
      actor?.stop();
    }
  }, [isOnScreen]);

  return (
    <Frame ref={frameRef} aria-hidden="true">
      <Canvas ref={canvasRef} />
    </Frame>
  );
};

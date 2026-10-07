import { FC, useEffect, useRef } from "react";

import tw, { css, styled } from "twin.macro";

import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import type { HeroClass } from "@/packages/games/heroes";
import type { RigActor, RigModel, RigRenderer } from "@/packages/graphics/rig";

interface HeroPortraitProps {
  heroId: string;
}

interface HeroKit {
  model: RigModel<HeroClass>;
  classes: HeroClass[];
  renderer: RigRenderer<HeroClass>;
  RigActor: typeof RigActor;
}

// The hero model, its classes and one sprite cache shared by every card, so a class is painted once however
// many cards show it. Loaded with the first portrait that comes near the screen.
let kit: Promise<HeroKit> | null = null;

const loadKit = () => {
  kit = kit ?? Promise.all([import("@/packages/games/heroes"), import("@/packages/graphics/rig")]).then(([heroes, rig]) => {
    const model = heroes.createHeroModel();

    return { model, classes: heroes.DEFAULT_HERO_CLASSES, renderer: new rig.RigRenderer(model, { maxEntries: 128 }), RigActor: rig.RigActor };
  });

  return kit;
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
  const isOnScreen = useInView(frameRef, { once: false, threshold: 0.1 });
  const actor = useCanvasEngine(canvasRef, {
    sizeRef: frameRef,
    create: async (context) => {
      const { model, classes, renderer, RigActor } = await loadKit();
      const hero = new RigActor(context, { model, skins: classes, renderer });

      hero.setSkinById(heroId);

      return hero;
    },
    resize: (hero, { width, pixelRatio }) => hero.resize(width, pixelRatio),
  }, [heroId]);

  useEffect(() => {
    if (actor && isOnScreen && !prefersReducedMotion()) {
      actor.start();
    } else {
      actor?.stop();
    }
  }, [actor, isOnScreen]);

  return (
    <Frame ref={frameRef} aria-hidden="true">
      <Canvas ref={canvasRef} />
    </Frame>
  );
};

import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Image } from "@/components/Image";
import { COLORS } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import type { PixelRevealStage } from "@/packages/effects/pixel-reveal";
import { PortraitLabels } from "@/types/details";

interface PortraitProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  labels: PortraitLabels;
}

interface DoneProps {
  isDone: boolean;
}

const Frame = tw.div`relative w-[160px] h-[213px] overflow-hidden`;

const Photo = styled(Image)(() => [
  tw`block w-full h-full object-cover`,
]);

// Sits over the photo and hands it back by fading out once the reveal ends. Until the engine draws, the
// canvas is transparent, so without script or with reduced motion the photo simply shows.
const Canvas = styled.canvas(({ isDone }: DoneProps) => [
  tw`absolute inset-0 w-full h-full pointer-events-none`,
  css`
    transition: opacity 0.6s ease;
  `,
  isDone && tw`opacity-0`,
]);

const Stage = styled.span(({ isDone }: DoneProps) => [
  tw`absolute left-[8px] bottom-[8px] text-[10px] font-semibold leading-none py-[5px] px-[7px] text-[var(--accent)]
     bg-[rgba(16, 16, 16, 0.85)] border-[1px] border-solid border-[var(--accent-muted)] rounded-[2px]`,
  css`
    transition: opacity 0.4s ease;
  `,
  isDone && tw`opacity-0`,
]);

const STAGE_LABELS: Record<Exclude<PixelRevealStage, "done">, keyof PortraitLabels> = {
  binary: "decoding",
  pixels: "upscaling",
  enhance: "enhancing",
};

// My photo materialises from its own data when the section comes into view: binary, then pixels, then an
// enhance pass to full resolution.
export const Portrait: FC<PortraitProps> = ({ src, fallbackSrc, alt, labels }: PortraitProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<PixelRevealStage | null>(null);
  const isInView = useInView(frameRef, { threshold: 0.4 });
  // Built once the photo is near and decoded, with the reveal engine's code fetched alongside. Without the
  // picture there is nothing to reveal, and the photo underneath stays as it is.
  const engine = useCanvasEngine(canvasRef, {
    sizeRef: frameRef,
    contextOptions: { alpha: false },
    isEnabled: !prefersReducedMotion(),
    create: async (context) => {
      const image = new window.Image();

      image.src = src;

      const [{ PixelRevealEngine }] = await Promise.all([import("@/packages/effects/pixel-reveal"), image.decode()]);

      return PixelRevealEngine.forCanvas(context, { image, width: image.naturalWidth, height: image.naturalHeight }, {
        config: { theme: { background: COLORS.surface, signal: COLORS.accent } },
        onStageChange: setStage,
      });
    },
    resize: (reveal, { width, height, pixelRatio }) => reveal.resize({ width, height }, pixelRatio),
  }, [src]);

  // Plays each time the picture comes into view, from binary again once it has left the screen.
  useEffect(() => {
    if (!engine) {
      return;
    }

    if (isInView) {
      engine.play();
    } else {
      engine.rewind();
    }
  }, [engine, isInView]);

  const isDone = stage === "done";

  return (
    <Frame ref={frameRef}>
      <Photo src={src} alt={alt} width="200" height="267" fallbackSrc={fallbackSrc} />
      <Canvas ref={canvasRef} isDone={isDone} aria-hidden="true" />
      {stage && <Stage isDone={isDone} aria-hidden="true">{labels[STAGE_LABELS[stage === "done" ? "enhance" : stage]]}</Stage>}
    </Frame>
  );
};

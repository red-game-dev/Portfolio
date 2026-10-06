import { FC, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Image } from "@/components/Image";
import { COLORS } from "@/config/theme";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { PixelRevealEngine, PixelRevealStage } from "@/packages/effects/pixel-reveal";
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
  const engineRef = useRef<PixelRevealEngine | null>(null);
  const [stage, setStage] = useState<PixelRevealStage | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isInView = useInView(frameRef, { threshold: 0.4 });

  useEffect(() => {
    const frame = frameRef.current;
    const context = canvasRef.current?.getContext("2d", { alpha: false });

    if (!frame || !context || prefersReducedMotion()) {
      return;
    }

    const image = new window.Image();
    // The page is hidden behind the intro loader at first, so the frame has no size yet; the engine sizes
    // itself whenever the frame does.
    const resizeObserver = new ResizeObserver(() => {
      engineRef.current?.resize({ width: frame.clientWidth, height: frame.clientHeight }, window.devicePixelRatio || 1);
    });
    let isCancelled = false;

    image.src = src;
    image.decode()
      .then(() => {
        if (isCancelled) {
          return;
        }

        engineRef.current = PixelRevealEngine.forCanvas(context, { image, width: image.naturalWidth, height: image.naturalHeight }, {
          config: { theme: { background: COLORS.surface, signal: COLORS.accent } },
          onStageChange: setStage,
        });
        resizeObserver.observe(frame);
        setIsReady(true);
      })
      // Without the picture there is nothing to reveal; the photo underneath stays as it is.
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [src]);

  // Plays each time the picture comes into view, from binary again once it has left the screen.
  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (isInView) {
      engineRef.current?.play();
    } else {
      engineRef.current?.rewind();
    }
  }, [isInView, isReady]);

  const isDone = stage === "done";

  return (
    <Frame ref={frameRef}>
      <Photo src={src} alt={alt} width="200" height="267" fallbackSrc={fallbackSrc} />
      <Canvas ref={canvasRef} isDone={isDone} aria-hidden="true" />
      {stage && <Stage isDone={isDone} aria-hidden="true">{labels[STAGE_LABELS[stage === "done" ? "enhance" : stage]]}</Stage>}
    </Frame>
  );
};

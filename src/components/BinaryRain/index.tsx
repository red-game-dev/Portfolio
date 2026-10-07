import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { BINARY_RAIN_VIEW } from "@/components/BinaryRain/config";
import { BINARY_RAIN_CONFIG } from "@/config/theme";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import useInView from "@/hooks/useInView";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import type { RainConfigOverrides } from "@/packages/effects/binary-rain";

interface BinaryRainProps {
  message: string[];
  // Defaults to the site's green rain.
  config?: RainConfigOverrides;
}

const Container = tw.div`absolute inset-0`;

const Canvas = tw.canvas`block w-full h-full`;

// React only wires the engine to the page: built (and its code fetched) as the rain comes near, sized to its
// container, and running only while enough of it is on screen. Reduced motion shows the message still.
export const BinaryRain: FC<BinaryRainProps> = ({ message, config = BINARY_RAIN_CONFIG }: BinaryRainProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisible = useInView(containerRef, { once: false, threshold: BINARY_RAIN_VIEW.decodeThreshold });
  const engine = useCanvasEngine(canvasRef, {
    sizeRef: containerRef,
    // Opaque: the renderer paints its own background, so the page never has to blend this layer.
    contextOptions: { alpha: false },
    create: async (context) => {
      const { BinaryRainEngine } = await import("@/packages/effects/binary-rain");

      return BinaryRainEngine.forCanvas(context, { message, isStatic: prefersReducedMotion(), config });
    },
    resize: (rain, { width, height, pixelRatio }) => rain.resize(width, height, pixelRatio),
  }, [config, message]);

  useEffect(() => {
    if (!engine) {
      return;
    }

    if (isVisible) {
      engine.start();
      engine.decode();
    } else {
      engine.stop();
    }
  }, [engine, isVisible]);

  return (
    <Container ref={containerRef}>
      <Canvas ref={canvasRef} aria-hidden="true" />
    </Container>
  );
};

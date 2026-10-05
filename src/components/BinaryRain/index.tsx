import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { BINARY_RAIN_VIEW } from "@/components/BinaryRain/config";
import { BINARY_RAIN_CONFIG } from "@/config/theme";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { BinaryRainEngine, RainConfigOverrides } from "@/packages/effects/binary-rain";

interface BinaryRainProps {
  message: string[];
  // Defaults to the site's green rain.
  config?: RainConfigOverrides;
}

const Container = tw.div`absolute inset-0`;

const Canvas = tw.canvas`block w-full h-full`;

// React only wires the engine to the page: size from a ResizeObserver, start and stop from an
// IntersectionObserver so nothing runs off screen, and reduced motion from the media query.
export const BinaryRain: FC<BinaryRainProps> = ({ message, config = BINARY_RAIN_CONFIG }: BinaryRainProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    // Opaque: the renderer paints its own background, so the page never has to blend this layer.
    const context = canvasRef.current?.getContext("2d", { alpha: false });

    if (!container || !context) {
      return;
    }

    const engine = BinaryRainEngine.forCanvas(context, {
      message,
      isStatic: prefersReducedMotion(),
      config,
    });
    const resizeObserver = new ResizeObserver(([entry]) => {
      engine.resize(entry.contentRect.width, entry.contentRect.height, window.devicePixelRatio || 1);
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        engine.stop();

        return;
      }

      engine.start();
      engine.decode();
    }, { threshold: BINARY_RAIN_VIEW.decodeThreshold });

    resizeObserver.observe(container);
    visibilityObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      engine.stop();
    };
  }, [config, message]);

  return (
    <Container ref={containerRef}>
      <Canvas ref={canvasRef} aria-hidden="true" />
    </Container>
  );
};

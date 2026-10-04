import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { BACKDROP_THEME, COLORS } from "@/config/theme";
import { ZoneId } from "@/config/zones";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { BackdropEngine, EmberScene, NeuralScene, RainScene, StarfieldScene } from "@/packages/effects/backdrop";

interface BackdropProps {
  zone: ZoneId;
  isEnabled: boolean;
}

// Narrow screens get fewer pixels and frames; the effect is ambient and the battery matters more.
const NARROW_WIDTH = 768;

const Canvas = tw.canvas`fixed inset-0 w-full h-full z-[1] pointer-events-none`;

// One fixed canvas behind every section. It shows through the margins and gaps between panels, and moves
// between scenes as the reader crosses from one zone to the next.
export const Backdrop: FC<BackdropProps> = ({ zone, isEnabled }: BackdropProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BackdropEngine | null>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d", { alpha: false });

    if (!isEnabled || !context) {
      return;
    }

    const isNarrow = window.innerWidth < NARROW_WIDTH;
    const engine = new BackdropEngine(context, {
      initialScene: zone,
      isStatic: prefersReducedMotion(),
      config: { background: COLORS.surface, framesPerSecond: isNarrow ? 24 : 30, maxPixelRatio: isNarrow ? 1 : 1.5 },
      scenes: [
        (random) => new RainScene(random, BACKDROP_THEME.rain),
        (random) => new NeuralScene(random, BACKDROP_THEME.neural),
        (random) => new StarfieldScene(random, BACKDROP_THEME.starfield),
        (random) => new EmberScene(random, BACKDROP_THEME.ember),
      ],
    });
    const resize = () => engine.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);

    engineRef.current = engine;
    resize();
    engine.start();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      engine.stop();
      engineRef.current = null;
    };
    // The engine is created once; zone changes go through setScene below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  useEffect(() => {
    engineRef.current?.setScene(zone);
  }, [zone]);

  return <Canvas ref={canvasRef} aria-hidden="true" />;
};

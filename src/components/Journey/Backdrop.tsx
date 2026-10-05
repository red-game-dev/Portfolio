import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { BACKDROP_THEME, COLORS, TRANSITION_THEME } from "@/config/theme";
import { ZoneId } from "@/config/zones";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import {
  BackdropEngine,
  BlockSnapTransition,
  CasinoScene,
  ChainScene,
  ChipFlipTransition,
  CollapseTransition,
  EmberScene,
  NeuralScene,
  PortalTransition,
  RainScene,
  transitionKey
} from "@/packages/effects/backdrop";

interface BackdropProps {
  zone: ZoneId;
  isEnabled: boolean;
}

// Narrow screens get fewer pixels and frames; the effect is ambient and the battery matters more.
const NARROW_WIDTH = 768;
// The engine is built a moment after the page settles, so its setup never joins the first long task.
const START_DELAY_MS = 400;

const Canvas = tw.canvas`fixed inset-0 w-full h-full z-[1] pointer-events-none`;

const createEngine = (context: CanvasRenderingContext2D, zone: ZoneId) => {
  const isNarrow = window.innerWidth < NARROW_WIDTH;

  return new BackdropEngine(context, {
    initialScene: zone,
    isStatic: prefersReducedMotion(),
    config: { background: COLORS.surface, framesPerSecond: isNarrow ? 24 : 30, maxPixelRatio: isNarrow ? 1 : 1.5 },
    scenes: [
      (random) => new RainScene(random, BACKDROP_THEME.rain),
      (random) => new NeuralScene(random, BACKDROP_THEME.neural),
      (random) => new ChainScene(random, BACKDROP_THEME.chain),
      (random) => new CasinoScene(random, BACKDROP_THEME.casino),
      (random) => new EmberScene(random, BACKDROP_THEME.ember),
    ],
    transitions: {
      [transitionKey("matrix", "ai")]: (random) => new CollapseTransition(random, TRANSITION_THEME.collapse),
      [transitionKey("ai", "chain")]: () => new BlockSnapTransition(TRANSITION_THEME.snap),
      [transitionKey("chain", "casino")]: (random) => new ChipFlipTransition(random, TRANSITION_THEME.flip),
      [transitionKey("casino", "mmo")]: (random) => new PortalTransition(random, TRANSITION_THEME.portal),
    },
  });
};

// One fixed canvas behind every section. It shows through the margins and gaps between panels, and moves
// between scenes as the reader crosses from one zone to the next.
export const Backdrop: FC<BackdropProps> = ({ zone, isEnabled }: BackdropProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BackdropEngine | null>(null);
  // Read when the engine is finally built, which can be after the zone has already changed.
  const zoneRef = useRef(zone);

  zoneRef.current = zone;

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d", { alpha: false });

    if (!isEnabled || !context) {
      return;
    }

    const resize = () => engineRef.current?.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    const timeout = window.setTimeout(() => {
      engineRef.current = createEngine(context, zoneRef.current);
      resize();
      engineRef.current.start();
      window.addEventListener("resize", resize);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", resize);
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [isEnabled]);

  useEffect(() => {
    engineRef.current?.setScene(zone);
  }, [zone]);

  return <Canvas ref={canvasRef} aria-hidden="true" />;
};

import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { LensSettings } from "@/config/lenses";
import { BACKDROP_THEME, COLORS, TRANSITION_THEME } from "@/config/theme";
import { ZoneId } from "@/config/zones";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import { usePageHeld } from "@/hooks/useScrollLock";
import { prefersReducedMotion } from "@/packages/accessibility/motion";

interface BackdropProps {
  zone: ZoneId;
  isEnabled: boolean;
  // A still frame per zone, for readers who want the facts without the motion.
  isStill: boolean;
  // "soft" crossfades between zones without the transition effects.
  transitions: LensSettings["transitions"];
}

// Narrow screens get fewer pixels and frames; the effect is ambient and the battery matters more.
const NARROW_WIDTH = 768;
// The engine is built a moment after the page settles, so its setup never joins the first long task.
const START_DELAY_MS = 400;

const Canvas = tw.canvas`fixed inset-0 w-full h-full z-[1] pointer-events-none`;

interface EngineOptions {
  zone: ZoneId;
  isStill: boolean;
  transitions: LensSettings["transitions"];
}

const createEngine = async (context: CanvasRenderingContext2D, { zone, isStill, transitions }: EngineOptions) => {
  const backdrop = await import("@/packages/effects/backdrop");
  const isNarrow = window.innerWidth < NARROW_WIDTH;
  const { transitionKey } = backdrop;

  return new backdrop.BackdropEngine(context, {
    initialScene: zone,
    isStatic: isStill || prefersReducedMotion(),
    config: { background: COLORS.surface, framesPerSecond: isNarrow ? 24 : 30, maxPixelRatio: isNarrow ? 1 : 1.5 },
    scenes: [
      (random) => new backdrop.RainScene(random, BACKDROP_THEME.rain),
      (random) => new backdrop.NeuralScene(random, BACKDROP_THEME.neural),
      (random) => new backdrop.ChainScene(random, BACKDROP_THEME.chain),
      (random) => new backdrop.CasinoScene(random, BACKDROP_THEME.casino),
      (random) => new backdrop.EmberScene(random, BACKDROP_THEME.ember),
    ],
    transitions: transitions !== "full" ? {} : {
      [transitionKey("matrix", "ai")]: (random) => new backdrop.CollapseTransition(random, TRANSITION_THEME.collapse),
      [transitionKey("ai", "chain")]: () => new backdrop.BlockSnapTransition(TRANSITION_THEME.snap),
      [transitionKey("chain", "casino")]: (random) => new backdrop.ChipFlipTransition(random, TRANSITION_THEME.flip),
      [transitionKey("casino", "mmo")]: (random) => new backdrop.PortalTransition(random, TRANSITION_THEME.portal),
    },
  });
};

const wait = (ms: number) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

// One fixed canvas behind every section. It shows through the margins and gaps between panels, and moves
// between scenes as the reader crosses from one zone to the next. It stops while a dialog or the intro
// holds the page, since nothing of it shows then.
export const Backdrop: FC<BackdropProps> = ({ zone, isEnabled, isStill, transitions }: BackdropProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHeld = usePageHeld();
  // Read when the engine is finally built, which can be after the zone has already changed.
  const zoneRef = useRef(zone);

  zoneRef.current = zone;

  const engine = useCanvasEngine(canvasRef, {
    isEnabled,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    // Built a moment after the page settles, so neither its code nor its setup joins the first long task.
    create: async (context) => {
      await wait(START_DELAY_MS);

      return createEngine(context, { zone: zoneRef.current, isStill, transitions });
    },
    resize: (backdrop, { width, height, pixelRatio }) => backdrop.resize(width, height, pixelRatio),
  }, [isStill, transitions]);

  useEffect(() => {
    if (!engine) {
      return;
    }

    if (isHeld) {
      engine.stop();
    } else {
      engine.setScene(zoneRef.current);
      engine.start();
    }
  }, [engine, isHeld]);

  useEffect(() => {
    engine?.setScene(zone);
  }, [engine, zone]);

  return <Canvas ref={canvasRef} aria-hidden="true" />;
};

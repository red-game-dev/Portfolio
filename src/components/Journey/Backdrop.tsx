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
  // Full motion, calm (slower and dimmer), or a still frame per zone.
  motion: LensSettings["backdrop"];
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
  motion: LensSettings["backdrop"];
  transitions: LensSettings["transitions"];
}

// How strongly each scene shows when calm, against the full view.
const CALM_INTENSITY = 0.55;

const calm = <T extends { intensity?: number }>(theme: T, isCalm: boolean): T => (isCalm ? { ...theme, intensity: (theme.intensity ?? 1) * CALM_INTENSITY } : theme);

const createEngine = async (context: CanvasRenderingContext2D, { zone, motion, transitions }: EngineOptions) => {
  const backdrop = await import("@/packages/effects/backdrop");
  const isNarrow = window.innerWidth < NARROW_WIDTH;
  const isCalm = motion === "calm";
  const { transitionKey } = backdrop;

  return new backdrop.BackdropEngine(context, {
    initialScene: zone,
    isStatic: motion === "still" || prefersReducedMotion(),
    config: { background: COLORS.surface, framesPerSecond: isCalm ? 20 : isNarrow ? 24 : 30, maxPixelRatio: isNarrow ? 1 : 1.5 },
    scenes: [
      (random) => new backdrop.RainScene(random, calm(BACKDROP_THEME.rain, isCalm)),
      (random) => new backdrop.NeuralScene(random, calm(BACKDROP_THEME.neural, isCalm)),
      (random) => new backdrop.ChainScene(random, calm(BACKDROP_THEME.chain, isCalm)),
      (random) => new backdrop.CasinoScene(random, calm(BACKDROP_THEME.casino, isCalm)),
      (random) => new backdrop.EmberScene(random, calm(BACKDROP_THEME.ember, isCalm)),
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
export const Backdrop: FC<BackdropProps> = ({ zone, isEnabled, motion, transitions }: BackdropProps) => {
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

      return createEngine(context, { zone: zoneRef.current, motion, transitions });
    },
    resize: (backdrop, { width, height, pixelRatio }) => backdrop.resize(width, height, pixelRatio),
  }, [motion, transitions]);

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

import { FC, useEffect, useRef } from "react";

import tw from "twin.macro";

import { BACKDROP_THEME, COLORS, TRANSITION_THEME } from "@/config/theme";
import { ZoneId } from "@/config/zones";
import useCanvasEngine from "@/hooks/useCanvasEngine";
import { usePageHeld } from "@/hooks/useScrollLock";
import { prefersReducedMotion } from "@/packages/accessibility/motion";

interface BackdropProps {
  zone: ZoneId;
  isEnabled: boolean;
}

// Every screen starts at full quality; a device whose frames run slow steps down to this sharpness.
const FULL_PIXEL_RATIO = 1.5;
const LOW_PIXEL_RATIO = 1;
// The engine is built a moment after the page settles, so its setup never joins the first long task.
const START_DELAY_MS = 400;

const Canvas = tw.canvas`fixed inset-0 w-full h-full z-[1] pointer-events-none`;

interface EngineOptions {
  zone: ZoneId;
}

const createEngine = async (context: CanvasRenderingContext2D, { zone }: EngineOptions) => {
  const backdrop = await import("@/packages/effects/backdrop");
  const { transitionKey } = backdrop;

  return new backdrop.BackdropEngine(context, {
    initialScene: zone,
    isStatic: prefersReducedMotion(),
    config: { background: COLORS.surface, framesPerSecond: 30, maxPixelRatio: FULL_PIXEL_RATIO },
    scenes: [
      (random) => new backdrop.RainScene(random, BACKDROP_THEME.rain),
      (random) => new backdrop.NeuralScene(random, BACKDROP_THEME.neural),
      (random) => new backdrop.ChainScene(random, BACKDROP_THEME.chain),
      (random) => new backdrop.CasinoScene(random, BACKDROP_THEME.casino),
      (random) => new backdrop.EmberScene(random, BACKDROP_THEME.ember),
    ],
    transitions: {
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
export const Backdrop: FC<BackdropProps> = ({ zone, isEnabled }: BackdropProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHeld = usePageHeld();
  // Read when the engine is finally built, which can be after the zone has already changed.
  const zoneRef = useRef(zone);
  // Lowered once if the device cannot keep up, and kept for every resize after.
  const pixelRatioCap = useRef(FULL_PIXEL_RATIO);
  const hasCheckedBudget = useRef(false);

  zoneRef.current = zone;

  const engine = useCanvasEngine(canvasRef, {
    isEnabled,
    contextOptions: { alpha: false },
    nearMargin: "0px",
    // Built a moment after the page settles, so neither its code nor its setup joins the first long task.
    create: async (context) => {
      await wait(START_DELAY_MS);

      return createEngine(context, { zone: zoneRef.current });
    },
    resize: (backdrop, { width, height, pixelRatio }) => backdrop.resize(width, height, Math.min(pixelRatio, pixelRatioCap.current)),
  }, []);

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

  // The first time it runs, it watches the frame rate for a moment: a phone that cannot hold it gets fewer
  // pixels from then on, and every other device keeps full quality.
  useEffect(() => {
    if (!engine || isHeld || hasCheckedBudget.current) {
      return;
    }

    let cancel = () => undefined as void;
    let isGone = false;

    void import("@/packages/animation/frame-loop").then(({ AnimationFrameScheduler, watchFrameBudget }) => {
      if (isGone) {
        return;
      }

      hasCheckedBudget.current = true;
      cancel = watchFrameBudget(new AnimationFrameScheduler(), {
        onSlow: () => {
          const canvas = canvasRef.current;

          pixelRatioCap.current = LOW_PIXEL_RATIO;

          if (canvas) {
            engine.resize(canvas.clientWidth, canvas.clientHeight, LOW_PIXEL_RATIO);
          }
        },
      });
    });

    return () => {
      isGone = true;
      cancel();
    };
  }, [engine, isHeld]);

  return <Canvas ref={canvasRef} aria-hidden="true" />;
};

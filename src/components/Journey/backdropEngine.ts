import { BACKDROP_THEME, COLORS, TRANSITION_THEME } from "@/config/theme";
import { ZoneId } from "@/config/zones";
import type { BackdropConfigOverrides } from "@/packages/effects/backdrop";

interface BackdropEngineOptions {
  zone: ZoneId;
  isStatic: boolean;
  config?: BackdropConfigOverrides;
}

// The journey's backdrop: every zone's scene and the moments between them. Its package loads here, on first use, so
// neither the page nor the share card carries it until a canvas asks.
export const createBackdropEngine = async (context: CanvasRenderingContext2D, { zone, isStatic, config }: BackdropEngineOptions) => {
  const backdrop = await import("@/packages/effects/backdrop");
  const { transitionKey } = backdrop;

  return new backdrop.BackdropEngine(context, {
    initialScene: zone,
    isStatic,
    config: { background: COLORS.surface, framesPerSecond: 30, ...config },
    scenes: [
      (random) => new backdrop.RainScene(random, BACKDROP_THEME.rain),
      (random) => new backdrop.NeuralScene(random, BACKDROP_THEME.neural),
      (random) => new backdrop.ChainScene(random, BACKDROP_THEME.chain),
      (random) => new backdrop.DevopsScene(random, BACKDROP_THEME.devops),
      (random) => new backdrop.CasinoScene(random, BACKDROP_THEME.casino),
      (random) => new backdrop.EmberScene(random, BACKDROP_THEME.ember),
      (random) => new backdrop.StarfieldScene(random, BACKDROP_THEME.stars),
    ],
    transitions: {
      [transitionKey("matrix", "ai")]: (random) => new backdrop.CollapseTransition(random, TRANSITION_THEME.collapse),
      [transitionKey("ai", "chain")]: () => new backdrop.BlockSnapTransition(TRANSITION_THEME.snap),
      [transitionKey("chain", "casino")]: (random) => new backdrop.ChipFlipTransition(random, TRANSITION_THEME.flip),
      // The casino deals itself in whichever universe the reader comes from, now the data centre on the way down.
      [transitionKey("devops", "casino")]: (random) => new backdrop.ChipFlipTransition(random, TRANSITION_THEME.flip),
      [transitionKey("casino", "mmo")]: (random) => new backdrop.PortalTransition(random, TRANSITION_THEME.portal),
      [transitionKey("mmo", "beyond")]: (random) => new backdrop.WarpTransition(random, TRANSITION_THEME.warp),
    },
  });
};

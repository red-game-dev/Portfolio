import {
  EmberSceneOptions,
  NeuralSceneOptions,
  RainSceneOptions,
  StarfieldSceneOptions
} from "@/packages/effects/backdrop";
import { RainConfigOverrides } from "@/packages/effects/binary-rain";

// Runtime colours for things twin.macro cannot reach, such as canvas drawing. Styled components keep
// their colours in the tw`` strings, which have to be static at build time.
export const COLORS = {
  accent: "#4bffa5",
  accentRgb: "75, 255, 165",
  accentMuted: "#2f6b4d",
  surface: "#101010",
  screen: "#0a0f0c",
} as const;

export const BINARY_RAIN_CONFIG: RainConfigOverrides = {
  theme: {
    background: COLORS.screen,
    trail: COLORS.accent,
    head: "#eafff3",
    letter: "#f2fff8",
    freshLetter: "#ffffff",
    caret: COLORS.accent,
    glow: `rgba(${COLORS.accentRgb}, 0.85)`,
  },
};

// The journey backdrop, one palette per zone. Kept dim: it sits behind the content, not in front of it.
export const BACKDROP_THEME: {
  rain: RainSceneOptions;
  neural: NeuralSceneOptions;
  starfield: StarfieldSceneOptions;
  ember: EmberSceneOptions;
} = {
  rain: { color: COLORS.accent, headColor: "#eafff3", glowColor: `rgba(${COLORS.accentRgb}, 0.8)`, intensity: 0.3 },
  neural: { linkRgb: COLORS.accentRgb, nodeColor: COLORS.accent, pulseColor: "rgba(234, 255, 243, 0.95)", intensity: 0.75 },
  starfield: {
    starColor: "#e8f4ff",
    nebulaColors: ["rgba(30, 105, 68, 0.35)", "rgba(58, 52, 130, 0.3)"],
    meteorRgb: "234, 255, 243",
    intensity: 0.9,
  },
  ember: { emberColor: "rgba(255, 196, 92, 0.95)", intensity: 0.75 },
};

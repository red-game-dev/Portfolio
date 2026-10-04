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

import { CROSSED_ZONES, ZONE_ACCENTS, ZoneId } from "@/config/zones";
import type {
  BlockSnapTransitionOptions,
  CasinoSceneOptions,
  ChainSceneOptions,
  ChipFlipTransitionOptions,
  CollapseTransitionOptions,
  EmberSceneOptions,
  NeuralSceneOptions,
  PortalTransitionOptions,
  RainSceneOptions,
  StarfieldSceneOptions,
  WarpTransitionOptions
} from "@/packages/effects/backdrop";
import type { RainConfigOverrides } from "@/packages/effects/binary-rain";
import type { LaunchTheme } from "@/packages/games/launch";
import type { VoyageStyle, VoyageTheme } from "@/packages/games/voyage";
import { hexToRgb, rgbChannels } from "@/packages/graphics/colour";

// Runtime colours for things twin.macro cannot reach, such as canvas drawing. Styled components keep
// their colours in the tw`` strings, which have to be static at build time. Every zone colour comes from
// ZONE_ACCENTS, which a test keeps equal to the --accent each zone sets in globals.css.
const rgbOf = (zone: ZoneId) => hexToRgb(ZONE_ACCENTS[zone]);
const rgbaOf = (zone: ZoneId, alpha: number) => `rgba(${rgbChannels(ZONE_ACCENTS[zone])}, ${alpha})`;

export const COLORS = {
  accent: ZONE_ACCENTS.matrix,
  accentRgb: rgbChannels(ZONE_ACCENTS.matrix),
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
  chain: ChainSceneOptions;
  casino: CasinoSceneOptions;
  ember: EmberSceneOptions;
  stars: StarfieldSceneOptions;
} = {
  rain: { color: COLORS.accent, headColor: "#eafff3", glowColor: `rgba(${COLORS.accentRgb}, 0.8)`, intensity: 0.3 },
  neural: { linkRgb: COLORS.accentRgb, nodeColor: COLORS.accent, pulseColor: "rgba(234, 255, 243, 0.95)", intensity: 0.75 },
  chain: { block: rgbOf("chain"), flash: [233, 220, 255], intensity: 0.7 },
  casino: {
    felt: "rgba(28, 120, 78, 0.38)",
    chipColors: [ZONE_ACCENTS.casino, ZONE_ACCENTS.mmo, ZONE_ACCENTS.ai, "#e6edf3"],
    suitColor: rgbaOf("casino", 0.9),
    wheelColor: rgbaOf("mmo", 0.55),
    intensity: 0.6,
  },
  ember: { emberColor: rgbaOf("mmo", 0.95), intensity: 0.75 },
  stars: { star: [236, 241, 255], nebula: [rgbOf("beyond"), rgbOf("chain")], intensity: 0.85 },
};

// The moments between zones, matched to each zone's accent in globals.css.
export const TRANSITION_THEME: {
  collapse: CollapseTransitionOptions;
  snap: BlockSnapTransitionOptions;
  flip: ChipFlipTransitionOptions;
  portal: PortalTransitionOptions;
  warp: WarpTransitionOptions;
} = {
  collapse: { from: rgbOf("matrix"), to: rgbOf("ai"), fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  snap: { from: rgbOf("ai"), to: rgbOf("chain"), cell: 64 },
  flip: { chipColors: [rgbOf("casino"), rgbOf("mmo"), rgbOf("ai")], rim: [255, 255, 255] },
  portal: { ring: rgbOf("mmo"), glow: [255, 170, 60] },
  warp: { streak: rgbOf("beyond"), flash: [236, 241, 255] },
};

// The launch out of the game world: the warm horizon of the zone being left, the bands of the zones crossed
// bottom first, and the starlight of Beyond.
export const LAUNCH_THEME: Partial<LaunchTheme> = {
  window: ZONE_ACCENTS.beyond,
  fin: "#3e4a6b",
  horizon: rgbaOf("mmo", 0.35),
  markers: CROSSED_ZONES.map((zone) => ZONE_ACCENTS[zone]),
};

// What each zone becomes as a universe on the far side of the black hole, and the deep it is set in.
const VOYAGE_UNIVERSES: Record<Exclude<ZoneId, "beyond">, { style: VoyageStyle; deep: string; hazard?: string }> = {
  matrix: { style: "matrix", deep: "#020a06", hazard: "#ff4d5e" },
  ai: { style: "neural", deep: "#020812", hazard: "#d17bff" },
  chain: { style: "blocks", deep: "#07040f" },
  casino: { style: "chips", deep: "#0f0309" },
  mmo: { style: "pixels", deep: "#0c0802" },
};

// The voyage past orbit: Beyond's starlight on the ship, and one universe per zone crossed, in its colour.
export const VOYAGE_THEME: Partial<VoyageTheme> = {
  window: ZONE_ACCENTS.beyond,
  universes: CROSSED_ZONES.flatMap((zone) => {
    const universe = zone === "beyond" ? undefined : VOYAGE_UNIVERSES[zone];

    return universe ? [{ style: universe.style, accent: ZONE_ACCENTS[zone], deep: universe.deep, hazard: universe.hazard ?? ZONE_ACCENTS[zone] }] : [];
  }),
};

// The real maps of the bodies the voyage draws, by the ids its looks name, fetched only once it opens and in
// this order, Earth first. NASA and USGS imagery, public domain: Blue Marble, Black Marble and the cloud cover
// for Earth, the LRO Moon, the Viking Mars, MESSENGER's Mercury, Cassini's Jupiter, New Horizons' Pluto.
export const VOYAGE_TEXTURES: Record<string, string> = {
  "earth-day": "/images/voyage/earth-day.webp",
  "earth-clouds": "/images/voyage/earth-clouds.webp",
  "earth-night": "/images/voyage/earth-night.webp",
  "moon": "/images/voyage/moon.webp",
  "mars": "/images/voyage/mars.webp",
  "jupiter": "/images/voyage/jupiter.webp",
  "mercury": "/images/voyage/mercury.webp",
  "pluto": "/images/voyage/pluto.webp",
};

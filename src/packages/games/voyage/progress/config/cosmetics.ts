import { CosmeticUnlock, PaintSpec, TrailSpec } from "../domain/progress";

const paint = (id: string, hull: string, hullShade: string, fin: string, window: string, accent: string | null = null): PaintSpec => ({
  id, hull, hullShade, fin, window, accent,
});

const trail = (id: string, core: string, edge: string, style: TrailSpec["style"]): TrailSpec => ({ id, core, edge, style });

// The paints a hull can wear (the first is every pilot's), each its colours; an accent of null keeps the universe's.
export const PAINTS: readonly PaintSpec[] = [
  paint("classic", "#e8ecf4", "#9aa3b8", "#c8323c", "#7fd8ff"),
  paint("explorer", "#f1e6c8", "#a8946a", "#3c7a5a", "#9ff0c8"),
  paint("ace", "#2a2f3a", "#12151c", "#e8b43a", "#ffd76a", "#ffd76a"),
  paint("obsidian", "#1b1d24", "#08090c", "#5a2a8a", "#c58bff", "#c58bff"),
  paint("synthwave", "#2b1240", "#140722", "#ff4fd8", "#4fd8ff", "#ff4fd8"),
  paint("aurora", "#d8f6ef", "#7fb8ad", "#4bffa5", "#c8a8ff", "#4bffa5"),
  paint("titanGold", "#f2d27a", "#a8862e", "#7a1f1f", "#fff2c2", "#ffd76a"),
  paint("galactic", "#1a2450", "#0a1028", "#9aa8ff", "#ffffff", "#9aa8ff"),
  paint("legend", "#ffffff", "#c8ccd8", "#ffc45c", "#ff4d5e", "#ffc45c"),
  paint("arctic", "#f4fbff", "#b8d4e4", "#4fa8d8", "#e8f8ff"),
  paint("crimson", "#c8323c", "#6e161c", "#1a1a1a", "#ffd0d4", "#ff4d5e"),
  paint("matrix", "#0c1a10", "#050b07", "#4bffa5", "#4bffa5", "#4bffa5"),
];

// The engine trails (the first is every pilot's).
export const TRAILS: readonly TrailSpec[] = [
  trail("standard", "#fff4d6", "#ff9a3c", "flame"),
  trail("horizon", "#f0e8ff", "#9a6bff", "ion"),
  trail("crimsonTrail", "#ffe0e0", "#ff3040", "flame"),
  trail("rainbow", "#ffffff", "#ff4fd8", "rainbow"),
  trail("voidTrail", "#d8dcff", "#3a40a0", "ion"),
  trail("starlight", "#ffffff", "#ffe68a", "sparkle"),
  trail("plasma", "#e8fbff", "#2fe0ff", "ion"),
  trail("pixel", "#fff2b0", "#ffc857", "pixel"),
  trail("sparkle", "#ffffff", "#7df9ff", "sparkle"),
  trail("ember", "#fff0d0", "#ff5a1f", "flame"),
];

export const DEFAULT_PAINT = "classic";
export const DEFAULT_TRAIL = "standard";

// Cosmetics won by stars alone, at these totals.
export const STAR_UNLOCKS: readonly CosmeticUnlock[] = [
  { cosmetic: "arctic", stars: 15 },
  { cosmetic: "pixel", stars: 30 },
  { cosmetic: "crimson", stars: 45 },
  { cosmetic: "sparkle", stars: 60 },
  { cosmetic: "matrix", stars: 90 },
  { cosmetic: "ember", stars: 120 },
];

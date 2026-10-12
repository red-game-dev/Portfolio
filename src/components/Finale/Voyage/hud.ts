import type { SitePreferences } from "@/config/preferences";

export type HudSetting = SitePreferences["voyage-hud"]["options"][number];

// A screen too small for the whole HUD: a phone held upright with under 520px of height, such as a small one with the
// browser's bars showing (`media.shortestPortrait`, written here for `matchMedia`).
export const SMALL_HUD_SCREEN = "(orientation: portrait) and (max-height: 520px)";

export interface HudLayout {
  // Whether the HUD can be compact at all, and so offers its info button.
  canCompact: boolean;
  // Whether it is compact now.
  isCompact: boolean;
}

// How much of the HUD shows: compact where the setting asks for it, or leaves it to a screen too small for all of it,
// unless the pilot has opened it in full from its info button.
export const hudLayout = (setting: HudSetting, isSmallScreen: boolean, isOpen: boolean): HudLayout => {
  const canCompact = setting === "compact" || (setting === "auto" && isSmallScreen);

  return { canCompact, isCompact: canCompact && !isOpen };
};

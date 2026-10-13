import type { SitePreferences } from "@/config/preferences";
import type { ScreenBox } from "@/packages/games/voyage";

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

// A box on the page, as an element's bounding rectangle gives it.
interface PageBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// The panels laid over the view (marked `data-covers`) as boxes from the stage's top left, those not shown left out, so
// the arrows the game draws at the screen's edge keep clear of them.
export const coveredBoxes = (stage: PageBox, panels: readonly PageBox[]): ScreenBox[] =>
  panels.filter((panel) => panel.width > 0 && panel.height > 0).map((panel) => ({
    left: panel.left - stage.left,
    top: panel.top - stage.top,
    right: panel.right - stage.left,
    bottom: panel.bottom - stage.top,
  }));

// The same boxes as a key, so they are handed to the game only when one moves.
export const boxesKey = (boxes: readonly ScreenBox[]): string =>
  boxes.map((box) => [box.left, box.top, box.right, box.bottom].map(Math.round).join(",")).join(";");

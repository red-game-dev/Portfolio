import { ZONE_ACCENTS } from "@/config/zones";
import { rgbChannels } from "@/packages/graphics/colour";

export type Lens = "recruiter" | "product" | "engineer";

export const LENSES: Lens[] = ["recruiter", "product", "engineer"];

export interface LensSettings {
  // "soft" crossfades between zones; "full" plays each crossing's transition.
  transitions: "none" | "soft" | "full";
  // Which text decodes from binary: nothing, headings only, or everything.
  decode: "off" | "headings" | "all";
  // The HUD, boss health, the fight and character select.
  gameLayer: boolean;
  depth: "facts" | "outcomes" | "everything";
}

export const LENS_SETTINGS: Record<Lens, LensSettings> = {
  // Every view gets the whole world on every screen: the live table, the duels and the switch effects. What
  // changes is the wording, the depth, the decoding and the full zone crossings.
  recruiter: { transitions: "soft", decode: "off", gameLayer: true, depth: "facts" },
  product: { transitions: "soft", decode: "headings", gameLayer: true, depth: "outcomes" },
  engineer: { transitions: "full", decode: "all", gameLayer: true, depth: "everything" },
};

// Before a reader has chosen (and while the server renders) the page behaves as the full view.
export const DEFAULT_LENS: Lens = "engineer";

export const LENS_STORAGE_KEY = "redgame.lens";

// redgame.dev/?view=recruiter opens straight into that view.
export const LENS_QUERY = "view";

const accent = (color: string) => ({ color, rgb: rgbChannels(color) });

// Each view has its own colour on the chooser and the switch, borrowed from the zone palette: cyan for
// the quick read, gold for product, the matrix green for engineers.
export const LENS_ACCENTS: Record<Lens, { color: string; rgb: string }> = {
  recruiter: accent(ZONE_ACCENTS.ai),
  product: accent(ZONE_ACCENTS.mmo),
  engineer: accent(ZONE_ACCENTS.matrix),
};

// Character select stats run from 1 to this.
export const LENS_STAT_MAX = 5;

export const isLens = (value: unknown): value is Lens => typeof value === "string" && (LENSES as string[]).includes(value);

// The view a link asks for (?view=recruiter), if it names one.
export const lensFromSearch = (search: string): Lens | null => {
  const asked = new URLSearchParams(search).get(LENS_QUERY);

  return isLens(asked) ? asked : null;
};

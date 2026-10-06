export type Lens = "recruiter" | "product" | "engineer";

export const LENSES: Lens[] = ["recruiter", "product", "engineer"];

export interface LensSettings {
  // Recruiters get a still world, so nothing moves while they read.
  backdrop: "still" | "animated";
  // "soft" crossfades between zones; "full" plays each crossing's transition.
  transitions: "none" | "soft" | "full";
  // Which text decodes from binary: nothing, headings only, or everything.
  decode: "off" | "headings" | "all";
  // The HUD, boss health, the fight and character select.
  gameLayer: boolean;
  depth: "facts" | "outcomes" | "everything";
}

export const LENS_SETTINGS: Record<Lens, LensSettings> = {
  recruiter: { backdrop: "still", transitions: "none", decode: "off", gameLayer: false, depth: "facts" },
  product: { backdrop: "animated", transitions: "soft", decode: "headings", gameLayer: true, depth: "outcomes" },
  engineer: { backdrop: "animated", transitions: "full", decode: "all", gameLayer: true, depth: "everything" },
};

// Before a reader has chosen (and while the server renders) the page behaves as the full view.
export const DEFAULT_LENS: Lens = "engineer";

export const LENS_STORAGE_KEY = "redgame.lens";

// redgame.dev/?view=recruiter opens straight into that view.
export const LENS_QUERY = "view";

// Each view has its own colour on the chooser and the switch, separate from the zone accents.
export const LENS_ACCENTS: Record<Lens, { color: string; rgb: string }> = {
  recruiter: { color: "#4fd8ff", rgb: "79, 216, 255" },
  product: { color: "#ffc45c", rgb: "255, 196, 92" },
  engineer: { color: "#4bffa5", rgb: "75, 255, 165" },
};

// Character select stats run from 1 to this.
export const LENS_STAT_MAX = 5;

export const isLens = (value: unknown): value is Lens => typeof value === "string" && (LENSES as string[]).includes(value);

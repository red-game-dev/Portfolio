// Sections that share a zone but not a subject each take a theme of their own: an accent (globals.css, on a
// data-theme run inside the zone's) and, where their content switches, a switch effect that belongs to what they
// are about. The zone still sets the backdrop world and the journey's crossings.
export type SectionThemeId = "web3" | "payments" | "skillAreas" | "platform" | "codeReview";

export const THEME_ACCENTS: Record<SectionThemeId, string> = {
  web3: "#b896ff",
  payments: "#36e3c4",
  skillAreas: "#ffb454",
  platform: "#6ea8ff",
  codeReview: "#c6f26b",
};

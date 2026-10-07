import { SECTION_IDS } from "@/config/sections";

export type ZoneId = "matrix" | "ai" | "chain" | "casino" | "mmo";

// The page as one journey. Each zone starts at a section and runs until the next zone starts.
export const ZONE_BOUNDARIES: Array<{ zone: ZoneId; startsAt: string }> = [
  { zone: "matrix", startsAt: SECTION_IDS.cover },
  { zone: "ai", startsAt: SECTION_IDS.aiUsage },
  { zone: "chain", startsAt: SECTION_IDS.web3 },
  { zone: "casino", startsAt: SECTION_IDS.igaming },
  { zone: "mmo", startsAt: SECTION_IDS.roster },
];

// Each zone's accent, the same as the --accent the page takes on there (globals.css), for places that
// show several zones at once, such as the mobile menu.
export const ZONE_ACCENTS: Record<ZoneId, string> = {
  matrix: "#4bffa5",
  ai: "#4fd8ff",
  chain: "#b896ff",
  casino: "#ff5fa2",
  mmo: "#ffc45c",
};

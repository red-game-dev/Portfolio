import { SECTION_IDS } from "@/config/sections";

export type ZoneId = "matrix" | "ai" | "chain" | "casino" | "mmo" | "beyond";

// The page as one journey. Each zone starts at a section and runs until the next zone starts.
export const ZONE_BOUNDARIES: Array<{ zone: ZoneId; startsAt: string }> = [
  { zone: "matrix", startsAt: SECTION_IDS.cover },
  { zone: "ai", startsAt: SECTION_IDS.aiUsage },
  { zone: "chain", startsAt: SECTION_IDS.web3 },
  { zone: "casino", startsAt: SECTION_IDS.igaming },
  { zone: "mmo", startsAt: SECTION_IDS.roster },
  // The run is over and the page lifts off: the finale is the journey's last zone, out past the game world.
  { zone: "beyond", startsAt: SECTION_IDS.finale },
];

// The zones a reader crosses before the run ends and the page lifts off into the last one, in order.
export const CROSSED_ZONES: ZoneId[] = ZONE_BOUNDARIES.slice(0, -1).map(({ zone }) => zone);

// Each zone's accent, the same as the --accent the page takes on there (globals.css), for places that
// show several zones at once, such as the mobile menu.
export const ZONE_ACCENTS: Record<ZoneId, string> = {
  matrix: "#4bffa5",
  ai: "#4fd8ff",
  chain: "#b896ff",
  casino: "#ff5fa2",
  mmo: "#ffc45c",
  beyond: "#c4d2ff",
};

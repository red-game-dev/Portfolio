import { ZONE_ACCENTS } from "@/config/zones";
import type { BugRaidTheme } from "@/packages/games/bug-raid";

// Bug Raid sits in the MMO zone, so production takes that zone's gold. Only what differs from the game's
// own theme, so the game's code stays out of the page until the arena loads it.
export const BUG_RAID_THEME: Partial<BugRaidTheme> = {
  background: "#0d0d0d",
  production: ZONE_ACCENTS.mmo,
  splat: ZONE_ACCENTS.mmo,
};

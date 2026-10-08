import { ZoneId } from "@/config/zones";

// How long a switch plays.
export const SWITCH_MS = 650;

// The cells laid over the new content as it lands: blocks for Web3, pixels for the game world.
export const BLOCK_GRID = { columns: 8, rows: 4 } as const;
export const PIXEL_GRID = { columns: 16, rows: 8 } as const;

// Each universe switches content its own way. AI: a neural beam scans the new content in. Web3: blocks
// confirm one after another in a diagonal wave. Casino: the content is dealt and flipped like a card.
// Game world: a retro pixel dissolve. Engineering: a terminal refreshes top to bottom. Beyond: the content
// drops out of warp, a little far and bright, and settles. Reduced motion just swaps.
export type SwitchEffect = "beam" | "blocks" | "deal" | "pixels" | "scan" | "warp";

export const ZONE_EFFECTS: Record<ZoneId, SwitchEffect> = {
  ai: "beam",
  chain: "blocks",
  casino: "deal",
  mmo: "pixels",
  matrix: "scan",
  beyond: "warp",
};

// The effect a switch plays: the one of the zone it sits in.
export const switchEffectFor = (zone: ZoneId): SwitchEffect => ZONE_EFFECTS[zone];

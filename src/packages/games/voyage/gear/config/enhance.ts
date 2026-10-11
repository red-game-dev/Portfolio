import { EnhanceTier } from "@/packages/progression/enhancement";

// The enhancement ladder every piece climbs: ten moons, then ten stars, then ten galaxies. A failure loses three
// steps among moons, four among stars and six among galaxies, back across a tier where it must; each step makes the
// piece a little stronger, more so the higher the tier. Another tier past galaxies is one more entry.
export const ENHANCE_TIERS: readonly EnhanceTier[] = [
  { id: "moon", steps: 10, fall: 3, chance: [0.92, 0.6], bonus: 0.02 },
  { id: "star", steps: 10, fall: 4, chance: [0.5, 0.28], bonus: 0.04 },
  { id: "galaxy", steps: 10, fall: 6, chance: [0.24, 0.08], bonus: 0.07 },
];

// What each tier's attempts take from the hold (one more for every four steps into the tier), and the Red Coin a
// first attempt costs, growing with every step.
export const ENHANCE_MATERIALS: Readonly<Record<string, string>> = { moon: "moonstone", star: "starShard", galaxy: "galaxyCore" };
export const ENHANCE_COIN = 40;
export const ENHANCE_COIN_GROWTH = 1.18;

// Spent with an attempt, it keeps a failure from losing any steps.
export const STABILISER = "stabiliser";

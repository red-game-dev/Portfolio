import { RarityTier } from "../domain/types";

// Ordered from the top. A skill earns the first tier whose minimum it meets.
export const DEFAULT_RARITY_TIERS: RarityTier[] = [
  { rarity: "legendary", minYears: 8 },
  { rarity: "epic", minYears: 5 },
  { rarity: "rare", minYears: 2 },
  { rarity: "common", minYears: 0 },
];

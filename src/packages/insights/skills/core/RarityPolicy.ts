import { DEFAULT_RARITY_TIERS } from "../config";
import { Rarity, RarityTier } from "../domain/types";

export class RarityPolicy {
  private readonly tiers: RarityTier[];

  constructor(tiers: RarityTier[] = DEFAULT_RARITY_TIERS) {
    this.tiers = [...tiers].sort((first, second) => second.minYears - first.minYears);
  }

  public rarityFor(years: number): Rarity {
    return this.tiers.find((tier) => years >= tier.minYears)?.rarity ?? "common";
  }
}

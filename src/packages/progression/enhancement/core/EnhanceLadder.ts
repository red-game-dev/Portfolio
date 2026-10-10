import { clamp } from "@/packages/math/clamp";
import type { RandomSource } from "@/packages/math/random";

import { EnhanceForm, EnhanceResult, EnhanceTier } from "../domain/types";

// An enhancement ladder made of tiers, each a run of steps, with nothing in it about what is enhanced: a weapon, a
// piece of armour, anything. A step is a whole number from 0 (none) to the top. An attempt succeeds by a chance
// that falls as the ladder climbs; a failure loses the steps its tier says, from the step it was tried at, and may
// fall back into the tier below; a protected attempt keeps its step on a failure. Another tier is one more entry.
export class EnhanceLadder {
  public readonly top: number;
  private readonly tiers: readonly EnhanceTier[];
  // The first step of each tier, so a step's tier is found without adding up the tiers below it every time.
  private readonly starts: readonly number[];

  constructor(tiers: readonly EnhanceTier[]) {
    if (tiers.length === 0 || tiers.some((tier) => !Number.isInteger(tier.steps) || tier.steps < 1 || tier.fall < 0)) {
      throw new Error("An enhancement ladder needs tiers of one or more whole steps, none falling a negative amount");
    }

    this.tiers = tiers;
    this.starts = tiers.map((_, index) => 1 + tiers.slice(0, index).reduce((sum, tier) => sum + tier.steps, 0));
    this.top = tiers.reduce((sum, tier) => sum + tier.steps, 0);
  }

  // A step held within the ladder.
  public clampStep(step: number): number {
    return clamp(Math.floor(step), 0, this.top);
  }

  // How a step reads: its tier and how many of that tier it counts.
  public formOf(step: number): EnhanceForm {
    const at = this.clampStep(step);
    const tierIndex = this.tierIndexOf(at);

    return at === 0 ? { step: 0, tier: null, tierIndex: -1, count: 0 } : { step: at, tier: this.tiers[tierIndex].id, tierIndex, count: at - this.starts[tierIndex] + 1 };
  }

  // The chance an attempt from a step reaches the next, eased across the tier that next step is in.
  public chanceFrom(step: number): number {
    const target = this.clampStep(step) + 1;

    if (target > this.top) {
      return 0;
    }

    const tierIndex = this.tierIndexOf(target);
    const tier = this.tiers[tierIndex];
    const along = tier.steps > 1 ? (target - this.starts[tierIndex]) / (tier.steps - 1) : 0;

    return tier.chance[0] + (tier.chance[1] - tier.chance[0]) * along;
  }

  // How many steps a failure from a step loses: its own tier's fall (the first tier's before any step).
  public fallFrom(step: number): number {
    const at = this.clampStep(step);

    return this.tiers[at === 0 ? 0 : this.tierIndexOf(at)].fall;
  }

  // Everything the steps up to one add, tier by tier.
  public bonusAt(step: number): number {
    const at = this.clampStep(step);

    return this.tiers.reduce((sum, tier, index) => sum + tier.bonus * clamp(at - this.starts[index] + 1, 0, tier.steps), 0);
  }

  // One attempt from a step, decided by one draw.
  public attempt(step: number, random: RandomSource, isProtected = false): EnhanceResult {
    const from = this.clampStep(step);
    const chance = this.chanceFrom(from);

    if (from >= this.top) {
      return { from, to: from, outcome: "top", chance: 0 };
    }

    if (random() < chance) {
      return { from, to: from + 1, outcome: "success", chance };
    }

    if (isProtected) {
      return { from, to: from, outcome: "kept", chance };
    }

    return { from, to: Math.max(0, from - this.fallFrom(from)), outcome: "fell", chance };
  }

  private tierIndexOf(step: number): number {
    let index = 0;

    while (index + 1 < this.starts.length && step >= this.starts[index + 1]) {
      index += 1;
    }

    return index;
  }
}

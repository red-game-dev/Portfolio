import { pickWeighted, RandomSource } from "@/packages/math/random";

import { BugKindConfig } from "../config";
import { BugKind } from "../domain/types";

// Picks a kind with probability proportional to its weight.
export const pickKind = (kinds: Record<BugKind, BugKindConfig>, random: RandomSource): BugKind => {
  const entries = Object.entries(kinds) as Array<[BugKind, BugKindConfig]>;

  return (pickWeighted(random, entries, ([, kind]) => kind.weight) ?? entries[entries.length - 1])[0];
};

// Wave 1 spawns every `every` ms; each later wave multiplies that by `speedup`, down to `min`.
export const spawnInterval = (wave: number, every: number, speedup: number, min: number) => Math.max(min, every * speedup ** (wave - 1));

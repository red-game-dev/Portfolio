import { RandomSource } from "@/packages/math/random";

import { PERK_IDS, PERK_OFFER, PERKS } from "../config/perks";
import { PerkId } from "../domain/perks";
import { GEAR_STATS, STAT_CAPS } from "../gear/config/slots";
import { GearStats } from "../gear/domain/gear";

export const isPerkId = (value: unknown): value is PerkId => typeof value === "string" && PERK_IDS.some((id) => id === value);

// How many times a run has taken a perk.
export const perkCount = (taken: readonly PerkId[], id: PerkId): number => taken.filter((entry) => entry === id).length;

// Up to three perks the run can still take, in a random order with none twice: none once every perk is at its most.
export const drawPerks = (random: RandomSource, taken: readonly PerkId[]): PerkId[] => {
  const open = PERKS.filter((perk) => perkCount(taken, perk.id) < perk.max).map((perk) => perk.id);
  const offer: PerkId[] = [];

  while (offer.length < PERK_OFFER && open.length > 0) {
    offer.push(...open.splice(Math.floor(random() * open.length), 1));
  }

  return offer;
};

// Two sets of stats added together, each capped where gear is (a critical hit's chance, resistance).
export const addStats = (first: GearStats, second: GearStats): GearStats => {
  const total: GearStats = { ...first };

  for (const stat of GEAR_STATS) {
    const value = second[stat];

    if (value) {
      total[stat] = (total[stat] ?? 0) + value;
    }
  }

  if (total.crit !== undefined) {
    total.crit = Math.min(STAT_CAPS.crit, total.crit);
  }

  if (total.resist !== undefined) {
    total.resist = Math.min(STAT_CAPS.resist, total.resist);
  }

  return total;
};

// What the perks a run has taken add to the ship, every one counted as many times as it was taken.
export const perkStats = (taken: readonly PerkId[]): GearStats => taken.reduce<GearStats>((total, id) => {
  const spec = PERKS.find((perk) => perk.id === id);

  return spec ? addStats(total, spec.stats) : total;
}, {});

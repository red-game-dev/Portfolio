import type { GearStats } from "../gear/domain/gear";

// A run's perks, one picked from three offered on reaching each universe and after each boss: most add to what the
// ship can do for the rest of the run, as a fitted piece does; a few change how something works (salvage, a kill,
// ammunition found).
export type PerkId =
  | "hotBarrels"
  | "heavyRounds"
  | "thickPlating"
  | "overcharge"
  | "afterburner"
  | "deepTanks"
  | "eagleEye"
  | "coolHead"
  | "tractor"
  | "ironclad"
  | "scavenger"
  | "vampire"
  | "quartermaster";

// What a perk adds (shares, as gear stats are), and how many times a run can take it.
export interface PerkSpec {
  id: PerkId;
  stats: GearStats;
  max: number;
}

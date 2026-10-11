import { PerkId, PerkSpec } from "../domain/perks";

// Every perk a run can take. Those with no stats change how something works: salvage goes faster, a kill mends the
// hull, ammunition found goes further.
export const PERKS: readonly PerkSpec[] = [
  { id: "hotBarrels", stats: { rate: 0.18 }, max: 3 },
  { id: "heavyRounds", stats: { damage: 0.18 }, max: 3 },
  { id: "thickPlating", stats: { hull: 0.25, plating: 0.1 }, max: 3 },
  { id: "overcharge", stats: { shields: 0.3, regen: 0.2 }, max: 3 },
  { id: "afterburner", stats: { thrust: 0.2, speed: 0.2 }, max: 2 },
  { id: "deepTanks", stats: { fuel: 0.3, economy: 0.15 }, max: 2 },
  { id: "eagleEye", stats: { crit: 0.08, range: 0.15 }, max: 3 },
  { id: "coolHead", stats: { heat: 0.25 }, max: 2 },
  { id: "tractor", stats: { magnet: 0.6 }, max: 2 },
  { id: "ironclad", stats: { resist: 0.1 }, max: 3 },
  { id: "scavenger", stats: {}, max: 1 },
  { id: "vampire", stats: {}, max: 2 },
  { id: "quartermaster", stats: {}, max: 1 },
];

export const PERK_IDS: readonly PerkId[] = PERKS.map((perk) => perk.id);

// How many are offered at a time, how much faster salvage goes with the scavenger's eye, the share of the hull a
// kill mends for each vampire taken, and how much further ammunition found goes with a quartermaster.
export const PERK_OFFER = 3;
export const SCAVENGER_SPEED = 1.8;
export const VAMPIRE_MEND = 0.025;
export const QUARTERMASTER_SHARE = 1.5;

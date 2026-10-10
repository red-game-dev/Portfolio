import { Rarity } from "../../economy/domain/items";
import { AmmoStock, AmmoType, GearSlot, GearStat, SlotSpec } from "../domain/gear";

// Every stat a piece can add, in the order the sheet lists them.
export const GEAR_STATS: readonly GearStat[] = [
  "hull", "plating", "pressure", "shields", "regen", "thrust", "speed", "turn", "fuel", "economy", "heat", "sensors", "damage", "rate", "range", "crit",
  "magnet", "resist",
];

// Every slot in the order the ship's sheet shows them.
export const GEAR_SLOTS: readonly GearSlot[] = [
  "cockpit", "armor", "engines", "wings", "shield", "sensors", "tank", "radiators", "primary", "pods", "reactor", "drive", "halo",
];

// What each slot adds at its first grade, and when the ship grows it: the first nine are there from the rocket (the
// wings once it is a shuttle, the radiators from its fourth mark), thruster pods come with the Corvette, a reactor
// with the Starship, a warp drive with the intergalactic starship and a halo ring with the Titan, each once the
// pilot's level is high enough too.
export const SLOT_SPECS: Readonly<Record<GearSlot, SlotSpec>> = {
  cockpit: { stats: { sensors: 0.06, crit: 0.02, magnet: 0.05 }, form: 0, pilotLevel: 1 },
  armor: { stats: { hull: 0.08, plating: 0.04, resist: 0.01 }, form: 0, pilotLevel: 1 },
  engines: { stats: { thrust: 0.06, speed: 0.03, economy: 0.02 }, form: 0, pilotLevel: 1 },
  wings: { stats: { turn: 0.06, speed: 0.02, thrust: 0.02 }, form: 5, pilotLevel: 5 },
  shield: { stats: { shields: 0.08, regen: 0.06 }, form: 0, pilotLevel: 1 },
  sensors: { stats: { sensors: 0.08, range: 0.04, magnet: 0.05 }, form: 0, pilotLevel: 1 },
  tank: { stats: { fuel: 0.1, economy: 0.04 }, form: 0, pilotLevel: 1 },
  radiators: { stats: { heat: 0.06, plating: 0.03 }, form: 3, pilotLevel: 3 },
  primary: { stats: { damage: 0.08, rate: 0.04, range: 0.02 }, form: 0, pilotLevel: 1 },
  pods: { stats: { thrust: 0.05, turn: 0.04, regen: 0.03 }, form: 10, pilotLevel: 20 },
  reactor: { stats: { regen: 0.08, rate: 0.05, shields: 0.04 }, form: 15, pilotLevel: 50 },
  drive: { stats: { speed: 0.06, economy: 0.06, thrust: 0.04 }, form: 20, pilotLevel: 90 },
  halo: { stats: { hull: 0.04, shields: 0.04, damage: 0.06, resist: 0.02, crit: 0.02 }, form: 25, pilotLevel: 150 },
};

// The pieces a new pilot's rocket is fitted with.
export const STOCK_SLOTS: readonly GearSlot[] = ["cockpit", "armor", "engines", "shield", "sensors", "tank", "primary"];

// How much more a grade gives than the first, one grade for each hull, and the pilot's level each grade needs.
export const GRADES = 6;
export const GRADE_SCALE: readonly number[] = [1, 1.4, 1.9, 2.5, 3.2, 4];
export const GRADE_LEVEL: readonly number[] = [1, 15, 40, 80, 140, 220];

// How much more a rarer piece gives.
export const RARITY_POWER: Readonly<Record<Rarity, number>> = { common: 1, uncommon: 1.15, rare: 1.35, epic: 1.6, legendary: 1.8 };

// How much more a piece gives for each level it has gained in use.
export const LEVEL_POWER = 0.004;

// The most any share may reach, so no stack of pieces breaks a run: a crit chance, a share of hits turned away.
export const STAT_CAPS = { crit: 0.5, resist: 0.6 };

// The racks for each kind of ammunition: what a rocket carries, and how much more each hull after it.
export const AMMO_TYPES: readonly AmmoType[] = ["rounds", "missiles", "mines", "slugs", "cells", "shells"];

export const AMMO_RACKS: Readonly<Record<AmmoType, { base: number; perHull: number }>> = {
  rounds: { base: 300, perHull: 150 },
  missiles: { base: 10, perHull: 4 },
  mines: { base: 6, perHull: 3 },
  slugs: { base: 8, perHull: 3 },
  cells: { base: 4, perHull: 2 },
  shells: { base: 30, perHull: 10 },
};

// What a new pilot's racks hold: the main gun's rounds, and nothing for weapons not yet found.
export const STARTER_AMMO: AmmoStock = { rounds: 300, missiles: 0, mines: 0, slugs: 0, cells: 0, shells: 0 };

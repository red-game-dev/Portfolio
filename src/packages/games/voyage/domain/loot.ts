import type { RandomSource } from "@/packages/math/random";

import { VoyageStyle } from "./theme";

// Where something can be found: drifting wrecks, rocks shot apart, comets, those who live in the universes, and
// their bosses.
export type LootSource = "wreck" | "rock" | "comet" | "alien" | "boss";

export interface ItemStack {
  id: string;
  count: number;
}

// What a wreck, a rock or the fallen give up: things, and now and then the plans to make something.
export interface Loot {
  items: ItemStack[];
  blueprints: string[];
}

// Where it was found: what from, in which kind of universe (null at home), how deep, and how strong the one it
// came from was.
export interface LootSituation {
  source: LootSource;
  style: VoyageStyle | null;
  universe: number;
  level: number;
}

// What decides what is found. The simulation only asks; the economy's catalogue answers, so the simulation never
// knows what things are worth.
export interface LootTable {
  roll(situation: LootSituation, random: RandomSource): Loot;
}

export const NO_LOOT_TABLE: LootTable = { roll: () => ({ items: [], blueprints: [] }) };

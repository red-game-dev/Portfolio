import type { RandomSource } from "@/packages/math/random";

import type { AmmoStock, GearDrop } from "../gear/domain/gear";
import { VoyageStyle } from "./theme";

// Where something can be found: drifting wrecks, rocks shot apart, comets, those who live in the universes, their
// bosses, caches drifting in space and the chests bosses leave.
export type LootSource = "wreck" | "rock" | "comet" | "alien" | "boss" | "cache" | "chest";

export interface ItemStack {
  id: string;
  count: number;
}

// What a wreck, a rock or the fallen give up: things, now and then the plans to make something, pieces of gear and
// ammunition.
export interface Loot {
  items: ItemStack[];
  blueprints: string[];
  gear?: GearDrop[];
  ammo?: Partial<AmmoStock>;
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

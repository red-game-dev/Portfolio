import { ModuleId } from "../../domain/components";
import { LootSource } from "../../domain/loot";
import { VoyageStyle } from "../../domain/theme";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITIES: readonly Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

// Raw stuff to build with, parts that mend one system, consumables used in flight, and relics worth a fortune.
export type ItemKind = "material" | "part" | "consumable" | "relic";

// What a consumable does when used in flight, as shares of the ship's maximum.
export type ItemUse =
  | { kind: "repair"; hull: number; module: number }
  | { kind: "fuel"; share: number }
  | { kind: "shields"; share: number }
  | { kind: "coolant"; degrees: number };

// One kind of thing the ship can carry: how rare, how much room it takes in the hold, what it brings broken
// down for Red Coin, where it is found, the universe it belongs to (found there most, and only past the site's
// own universes elsewhere) or the first universe it turns up in, the system it mends, and what it does used.
export interface ItemSpec {
  id: string;
  kind: ItemKind;
  rarity: Rarity;
  volume: number;
  value: number;
  sources: readonly LootSource[];
  style?: VoyageStyle;
  minUniverse?: number;
  mends?: ModuleId;
  use?: ItemUse;
}


export type { ItemStack, Loot, LootSource } from "../../domain/loot";

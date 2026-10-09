import { ModuleId } from "../../domain/components";
import { FaultKind } from "../../domain/faults";
import { ItemStack, Rarity } from "./items";
import { PilotRecords } from "./profile";

// The five hulls, from the rocket every pilot begins in to an intergalactic starship, each built in five marks.
export type HullTier = "rocket" | "shuttle" | "corvette" | "starship" | "intergalactic";

// The two currencies: Red Coin, paid for nearly everything, and Void Shards, torn from black holes and bosses,
// which the great hulls need.
export type CurrencyCode = "RED" | "VOID";

export type Purse = Record<CurrencyCode, number>;

// What something costs: coin of each kind, things from the hold, and the plans needed first.
export interface Cost {
  coin: Purse;
  items: ItemStack[];
  blueprint: string | null;
}

// A cost weighed against what the pilot has: each part short, and whether all of it is there.
export interface Shortfall {
  coin: Purse;
  items: ItemStack[];
  blueprint: string | null;
  isReady: boolean;
}

// A plan for making something from what is in the hold.
export interface Recipe {
  id: string;
  makes: ItemStack;
  needs: ItemStack[];
  coin: number;
  // Known from the start, or found as a blueprint first.
  isKnown: boolean;
}

// Why money moved, which names the account it moved through.
export type EarningReason = "discovery" | "landing" | "bounty" | "rescue" | "boss" | "universe" | "salvage" | "flight" | "recycling";

export type SpendingReason = "upgrade" | "crafting" | "repair" | "exchange";

// What the pilot can do next, ready to do in one click.
export type Suggestion =
  | { kind: "upgrade"; level: number; tier: HullTier; mark: number }
  | { kind: "repair"; fault: number; faultKind: FaultKind }
  | { kind: "craft"; recipe: string; reason: "fault" | "upgrade" }
  | { kind: "use"; item: string; reason: "hull" | "fuel" | "shields" | "heat" };

// A deed that pays: a new place reached, a first landing, a hostile downed, a world saved, a boss brought down,
// a universe reached.
export type Deed =
  | { kind: "discovery"; place: string }
  | { kind: "landing"; place: string }
  | { kind: "bounty"; level: number }
  | { kind: "rescue"; target: string; isDeflected: boolean }
  | { kind: "boss"; name: string }
  | { kind: "universe"; index: number };

// What the economy needs to know of the ship to suggest the next thing to do: whether it is flying, its faults,
// and its hull, fuel and shields as shares, and its heat as a share of what its plating is built for.
export interface ShipStatus {
  isFlying: boolean;
  faults: Array<{ id: number; kind: FaultKind }>;
  hull: number;
  fuel: number;
  shields: number;
  heat: number;
}

// What came of stowing a find: what went in the hold, what was left for want of room, plans new to the pilot,
// and Red Coin for copies of plans already known.
export interface Stowed {
  kept: ItemStack[];
  lost: ItemStack[];
  blueprints: string[];
  paid: number;
}

// A ledger entry as the UI shows it: what it was for (a key such as "upgrade:7" the UI words), and what it did
// to the wallet.
export interface HistoryRow {
  id: string;
  at: number;
  memo: string;
  amounts: Purse;
}

// A row of the hold as the UI shows it.
export interface CargoRow {
  id: string;
  count: number;
  rarity: Rarity;
  volume: number;
  value: number;
  isUsable: boolean;
  mends: ModuleId | null;
}

// What a ship at a level can do, in the units the UI shows: hull, shields and fuel in points, thrust against a
// Rocket Mk I's, hold space, the heat its plating is built for (Celsius), the pressure it can bear (bar), the
// damage of one shot, and what it fires.
export interface ShipStats {
  hull: number;
  shields: number;
  fuel: number;
  thrust: number;
  cargo: number;
  plating: number;
  pressure: number;
  guns: number;
  weapon: "cannon" | "laser";
}

// Everything the UI shows about the economy, as plain data that changes only when something happens.
export interface EconomyView {
  level: number;
  tier: HullTier;
  mark: number;
  stats: ShipStats;
  purse: Purse;
  cargo: CargoRow[];
  capacity: number;
  used: number;
  blueprints: string[];
  next: { level: number; tier: HullTier; mark: number; cost: Cost; shortfall: Shortfall; stats: ShipStats } | null;
  recipes: Array<{ recipe: Recipe; isKnown: boolean; shortfall: Shortfall }>;
  history: HistoryRow[];
  // What a Void Shard sells and buys for, in Red Coin.
  prices: { sell: number; buy: number };
  suggestion: Suggestion | null;
  // Each fault on board and what would fix it from the hold now (null when nothing would).
  repairs: Array<{ fault: number; kind: FaultKind; parts: ItemStack[] | null }>;
  records: PilotRecords;
}

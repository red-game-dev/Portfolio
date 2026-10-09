import { ItemSpec, LootSource, Rarity } from "../domain/items";

type Extra = Omit<Partial<ItemSpec>, "id" | "kind" | "rarity" | "volume" | "value" | "sources">;

const item = (id: string, kind: ItemSpec["kind"], rarity: Rarity, volume: number, value: number, sources: LootSource[], extra: Extra = {}): ItemSpec => ({
  id,
  kind,
  rarity,
  volume,
  value,
  sources,
  ...extra,
});

// Everything there is to find. Common salvage looks like junk and is what most repairs and the first upgrades
// are made of; parts mend one system each; consumables are used in flight; each of the site's universes, and
// each kind of deep one, has a material of its own; bosses and the deep give the rarest.
export const ITEMS: Readonly<Record<string, ItemSpec>> = Object.fromEntries([
  item("scrap", "material", "common", 1, 2, ["wreck", "rock", "alien"]),
  item("wiring", "material", "common", 1, 4, ["wreck", "alien"]),
  item("titanium", "material", "uncommon", 2, 10, ["wreck", "rock"]),
  item("carbon", "material", "uncommon", 1, 9, ["wreck", "rock"]),
  item("coolant", "material", "uncommon", 1, 8, ["wreck", "comet"]),
  item("circuits", "material", "uncommon", 1, 12, ["wreck", "alien"]),
  item("ice", "material", "common", 2, 3, ["comet", "rock"]),
  item("alloy", "material", "rare", 2, 30, ["alien", "boss"], { minUniverse: 0 }),
  item("plasma", "material", "rare", 1, 40, ["alien", "boss"], { minUniverse: 2 }),
  item("codeShards", "material", "rare", 1, 35, ["alien", "wreck"], { style: "matrix" }),
  item("synapseGel", "material", "rare", 1, 35, ["alien", "wreck"], { style: "neural" }),
  item("hashCrystals", "material", "rare", 1, 35, ["alien", "wreck"], { style: "blocks" }),
  item("luckyChips", "material", "rare", 1, 35, ["alien", "wreck"], { style: "chips" }),
  item("pixelDust", "material", "rare", 1, 35, ["alien", "wreck"], { style: "pixels" }),
  item("stardust", "material", "rare", 1, 45, ["rock", "alien", "wreck"], { style: "nebula" }),
  item("crystalShards", "material", "rare", 1, 45, ["rock", "alien"], { style: "crystal" }),
  item("emberCore", "material", "rare", 1, 45, ["alien", "rock"], { style: "ember" }),
  item("voidEssence", "material", "epic", 1, 90, ["wreck", "alien"], { style: "void" }),
  item("abyssPearl", "material", "epic", 1, 90, ["alien", "wreck"], { style: "abyss" }),
  item("exotic", "material", "epic", 1, 150, ["boss"]),
  item("beacon", "relic", "legendary", 1, 400, ["wreck"], { minUniverse: 0 }),
  item("whaleSong", "relic", "legendary", 1, 300, ["alien"], { minUniverse: 5 }),
  item("hullPlate", "part", "uncommon", 2, 20, ["wreck"], { mends: "hull" }),
  item("nozzle", "part", "uncommon", 2, 24, ["wreck"], { mends: "engines" }),
  item("emitter", "part", "rare", 1, 30, ["wreck", "alien"], { mends: "shields" }),
  item("sensorArray", "part", "uncommon", 1, 22, ["wreck"], { mends: "sensors" }),
  item("fuelLine", "part", "common", 1, 12, ["wreck"], { mends: "fuel" }),
  item("radiatorFin", "part", "uncommon", 2, 18, ["wreck"], { mends: "radiators" }),
  item("repairKit", "consumable", "uncommon", 1, 25, ["wreck"], { use: { kind: "repair", hull: 0.3, module: 0.35 } }),
  item("fuelCell", "consumable", "common", 1, 10, ["wreck"], { use: { kind: "fuel", share: 0.45 } }),
  item("shieldCell", "consumable", "uncommon", 1, 18, ["wreck", "alien"], { use: { kind: "shields", share: 1 } }),
  item("coolantFlask", "consumable", "uncommon", 1, 14, ["wreck", "comet"], { use: { kind: "coolant", degrees: 250 } }),
].map((spec) => [spec.id, spec]));

// How likely each rarity is to turn up, by weight, and how a boss's hoard leans to the rare.
export const RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 50, uncommon: 30, rare: 13, epic: 5, legendary: 1.2 };
export const BOSS_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 10, uncommon: 25, rare: 35, epic: 22, legendary: 6 };

// Each source: how many things it can hold, and how often it holds nothing worth taking.
export const SOURCE_ROLLS: Readonly<Record<LootSource, { rolls: [number, number]; empty: number }>> = {
  wreck: { rolls: [1, 3], empty: 0.3 },
  rock: { rolls: [1, 1], empty: 0.55 },
  comet: { rolls: [1, 2], empty: 0.2 },
  alien: { rolls: [1, 2], empty: 0.35 },
  boss: { rolls: [4, 6], empty: 0 },
};

// A universe's own material turns up elsewhere in the deep this much less often.
export const AWAY_CHANCE = 0.2;

// Plans found now and then: for parts and consumables in wrecks, for the greater hulls on the bosses that guard
// the universes (the deeper, the greater), from the first universe each can be found in.
export const BLUEPRINT_DROPS: ReadonlyArray<{ id: string; sources: readonly LootSource[]; chance: number; minUniverse: number }> = [
  { id: "recipe:nozzle", sources: ["wreck"], chance: 0.08, minUniverse: -1 },
  { id: "recipe:sensorArray", sources: ["wreck"], chance: 0.08, minUniverse: -1 },
  { id: "recipe:radiatorFin", sources: ["wreck"], chance: 0.08, minUniverse: -1 },
  { id: "recipe:coolantFlask", sources: ["wreck", "comet"], chance: 0.06, minUniverse: -1 },
  { id: "recipe:emitter", sources: ["wreck", "alien"], chance: 0.06, minUniverse: 0 },
  { id: "recipe:shieldCell", sources: ["wreck", "alien"], chance: 0.06, minUniverse: 0 },
  { id: "recipe:alloy", sources: ["alien", "boss"], chance: 0.1, minUniverse: 1 },
  { id: "hull:shuttle", sources: ["wreck"], chance: 0.1, minUniverse: -1 },
  { id: "hull:corvette", sources: ["boss"], chance: 0.7, minUniverse: 0 },
  { id: "hull:starship", sources: ["boss"], chance: 0.5, minUniverse: 3 },
  { id: "hull:intergalactic", sources: ["boss"], chance: 0.4, minUniverse: 6 },
];

import { MemoryAdapter } from "@/packages/browser/store";
import {
  Backpack,
  CatalogLootTable,
  configForLevel,
  DEFAULT_VOYAGE_CONFIG,
  Hangar,
  isPilotProfile,
  ITEMS,
  levelOf,
  markOf,
  MAX_LEVEL,
  newArmoryProfile,
  newCareer,
  newProfile,
  newProgressProfile,
  PilotRepository,
  recipeBlueprint,
  RECIPES,
  TIERS,
  tierOf,
  upgradeCost,
  Wallet,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const at = () => 1_000;

interface Setup {
  coin?: number;
  shards?: number;
  level?: number;
  blueprints?: string[];
}

// A hangar holding `cargo`, knowing `blueprints`, with `coin` Red Coin and `shards` Void Shards.
const hangarWith = (cargo: Record<string, number> = {}, { coin = 0, shards = 0, level = 0, blueprints = [] }: Setup = {}) => {
  // An empty hold, so each test holds exactly what it stows; the starter kit has a test of its own.
  const hangar = new Hangar({ ...newProfile(), cargo: [], level, blueprints }, { now: at });

  Object.entries(cargo).forEach(([id, count]) => hangar.stow({ items: [{ id, count }], blueprints: [] }));

  if (coin > 0 || shards > 0) {
    const wallet = Wallet.from(hangar.toProfile().ledger);

    wallet.earn("flight", { RED: coin, VOID: shards }, "test", 0);

    return new Hangar({ ...hangar.toProfile(), ledger: wallet.toSnapshot() }, { now: at });
  }

  return hangar;
};

describe("voyage economy", () => {
  test("the hold is limited by room, takes all or nothing, and drops what it does not know", () => {
    const hold = new Backpack(10, [{ id: "mystery", count: 3 }]);

    expect(hold.used).toBe(0);
    expect(hold.add("titanium", 7)).toBe(5);
    expect(hold.free).toBe(0);
    expect(hold.add("scrap", 1)).toBe(0);
    expect(hold.missing([{ id: "titanium", count: 6 }, { id: "scrap", count: 1 }])).toEqual([{ id: "titanium", count: 1 }, { id: "scrap", count: 1 }]);
    expect(hold.take([{ id: "titanium", count: 6 }])).toBe(false);
    expect(hold.count("titanium")).toBe(5);
    expect(hold.take([{ id: "titanium", count: 2 }, { id: "titanium", count: 2 }])).toBe(true);
    expect(hold.count("titanium")).toBe(1);
  });

  test("the wallet is a double entry ledger: every coin has a source, spending needs the balance, and old entries close into one", () => {
    const wallet = Wallet.open();

    wallet.earn("boss", { RED: 250, VOID: 3 }, "boss", 1);
    wallet.earn("discovery", { RED: 15 }, "discovery:mars", 2);
    expect(wallet.purse).toEqual({ RED: 265, VOID: 3 });
    expect(wallet.spend("upgrade", { RED: 300 }, "upgrade:1", 3)).toBe(false);
    expect(wallet.spend("upgrade", { RED: 100, VOID: 1 }, "upgrade:1", 3)).toBe(true);
    expect(wallet.exchange({ currency: "VOID", amount: 1 }, { currency: "RED", amount: 150 }, "sellVoid", 4)).toBe(true);
    expect(wallet.purse).toEqual({ RED: 315, VOID: 1 });
    expect(wallet.history(2).map((row) => row.memo)).toEqual(["sellVoid", "upgrade:1"]);

    for (let index = 0; index < 700; index += 1) {
      wallet.earn("landing", { RED: 1 }, "landing", 10 + index);
    }

    const kept = Wallet.from(wallet.toSnapshot());

    expect(wallet.toSnapshot().journal.length).toBeLessThanOrEqual(301);
    expect(kept.purse).toEqual({ RED: 1015, VOID: 1 });
  });

  test("loot is repeatable from a seed, never empty for a boss, and a universe's own material is found there and only rarely elsewhere in the deep", () => {
    const table = new CatalogLootTable();
    const roll = (style: Parameters<CatalogLootTable["roll"]>[0]["style"], source: "wreck" | "alien" | "boss", seed: number, universe = 0) => (
      table.roll({ source, style, universe, level: 3 }, createSeededRandom(seed))
    );
    const found = (style: Parameters<typeof roll>[0], id: string, universe = 0) => Array.from({ length: 400 }, (_, seed) => roll(style, "alien", seed + 1, universe))
      .filter((loot) => loot.items.some((item) => item.id === id)).length;

    expect(roll("matrix", "wreck", 7)).toEqual(roll("matrix", "wreck", 7));
    expect(Array.from({ length: 50 }, (_, seed) => roll("pixels", "boss", seed + 1)).every((loot) => loot.items.length > 0)).toBe(true);
    expect(found("matrix", "codeShards")).toBeGreaterThan(10);
    expect(found(null, "codeShards", -1)).toBe(0);
    expect(found("neural", "codeShards", 1)).toBe(0);
    expect(found("ember", "codeShards", 6)).toBeLessThan(found("matrix", "codeShards"));
    expect(Array.from({ length: 400 }, (_, seed) => roll(null, "boss", seed + 1, 0)).some((loot) => loot.blueprints.includes("hull:intergalactic"))).toBe(false);
  });

  test("30 levels over six hulls, each stronger, bigger in the hold and built for more heat and pressure", () => {
    const configs = Array.from({ length: MAX_LEVEL + 1 }, (_, level) => configForLevel(DEFAULT_VOYAGE_CONFIG, level));

    expect(TIERS.map((tier) => levelOf(tier, 1))).toEqual([0, 5, 10, 15, 20, 25]);
    expect([tierOf(0), markOf(0), tierOf(24), markOf(24), tierOf(29), markOf(29)]).toEqual(["rocket", 1, "intergalactic", 5, "titan", 5]);
    configs.slice(1).forEach((config, index) => {
      const before = configs[index];

      expect(config.ship.hull).toBeGreaterThan(before.ship.hull);
      expect(config.ship.thrust).toBeGreaterThanOrEqual(before.ship.thrust);
      expect(config.arms.damage).toBeGreaterThan(before.arms.damage);
      expect(config.thermal.ratings.hull).toBeGreaterThan(before.thermal.ratings.hull);
      expect(config.thermal.pressureBar).toBeGreaterThan(before.thermal.pressureBar);
    });
    // A Shuttle lands on Venus: 465 C and 92 bar at the surface. A Rocket cannot.
    expect(configs[5].thermal.ratings.hull).toBeGreaterThan(465);
    expect(configs[5].thermal.pressureBar).toBeGreaterThan(92);
    expect(configs[4].thermal.pressureBar).toBeLessThan(92);
    expect(configs[10].arms.kind).toBe("laser");
  });

  test("an upgrade costs more each level, a new hull needs its blueprint, and the great hulls Void Shards", () => {
    const coins = Array.from({ length: MAX_LEVEL }, (_, index) => upgradeCost(index + 1)?.coin.RED ?? 0);

    expect(coins.every((coin, index) => index === 0 || coin > coins[index - 1])).toBe(true);
    expect(upgradeCost(5)?.blueprint).toBe("hull:shuttle");
    expect(upgradeCost(6)?.blueprint).toBeNull();
    expect(upgradeCost(5)?.items.map((item) => item.id)).toContain("codeShards");
    expect(upgradeCost(10)?.coin.VOID).toBeGreaterThan(0);
    expect(upgradeCost(0)).toBeNull();
    expect(upgradeCost(MAX_LEVEL + 1)).toBeNull();
  });

  test("deeds pay into the ledger and count in the records; a run ends paid for its points", () => {
    const hangar = hangarWith();

    hangar.reward({ kind: "discovery", place: "mars" });
    hangar.reward({ kind: "bounty", level: 4 });
    hangar.reward({ kind: "boss", name: "Veldara" });
    hangar.reward({ kind: "universe", index: 2 });
    expect(hangar.purse).toEqual({ RED: 15 + 24 + 250 + 100, VOID: 4 });
    expect(hangar.endRun(4000)).toBe(100);
    expect(hangar.view().records).toMatchObject({ runs: 1, bestScore: 4000, bosses: 1, universes: 3 });
    expect(hangar.view().history[0].memo).toBe("flight:4000");
  });

  test("a welcome from those who live on a world pays their gift, a Void Shard with it, from its own account", () => {
    const hangar = hangarWith();

    hangar.reward({ kind: "hosted", place: "Veldara c" });
    expect(hangar.purse).toEqual({ RED: 60, VOID: 1 });
    expect(hangar.view().history[0].memo).toBe("hosted:Veldara c");
  });

  test("a find fills the hold as far as it has room, learns new plans and is paid for copies of known ones", () => {
    const hangar = hangarWith({ titanium: 6 });
    const stowed = hangar.stow({ items: [{ id: "titanium", count: 3 }, { id: "scrap", count: 2 }], blueprints: ["recipe:nozzle", "recipe:repairKit"] });

    expect(stowed.kept).toEqual([{ id: "titanium", count: 1 }]);
    expect(stowed.lost).toEqual([{ id: "titanium", count: 2 }, { id: "scrap", count: 2 }]);
    expect(stowed.blueprints).toEqual(["recipe:nozzle"]);
    expect(hangar.purse.RED).toBe(20);
    expect(hangar.knows(recipeBlueprint("nozzle"))).toBe(true);
  });

  test("the next upgrade waits for every coin, material and plan, then takes them in one click and grows the hold", () => {
    const needs = Object.fromEntries((upgradeCost(1)?.items ?? []).map(({ id, count }) => [id, count]));
    const short = hangarWith({ scrap: needs.scrap }, { coin: 100 });

    expect(short.nextUpgrade()?.shortfall).toMatchObject({ isReady: false, items: [{ id: "wiring", count: needs.wiring }] });
    expect(short.upgrade()).toBeNull();

    const ready = hangarWith(needs, { coin: 100 });

    expect(ready.suggest(null)).toEqual({ kind: "upgrade", level: 1, tier: "rocket", mark: 2 });
    expect(ready.upgrade()).toBe(1);
    expect(ready.purse.RED).toBe(100 - (upgradeCost(1)?.coin.RED ?? 0));
    expect(ready.count("scrap")).toBe(0);
    expect(ready.view().capacity).toBeGreaterThan(hangarWith().view().capacity);

    const shuttle = hangarWith({ titanium: 2, circuits: 1, carbon: 1, codeShards: 1 }, { coin: 1000, level: 4 });

    expect(shuttle.nextUpgrade()?.shortfall.blueprint).toBe("hull:shuttle");
    shuttle.stow({ items: [], blueprints: ["hull:shuttle"] });
    expect(shuttle.upgrade()).toBe(5);
  });

  test("crafting needs the plan and the materials; breaking down pays each thing's worth", () => {
    const hangar = hangarWith({ titanium: 2, carbon: 1, scrap: 4, wiring: 1 }, { coin: 50 });

    expect(hangar.craft("nozzle")).toBe(false);
    expect(hangar.craft("repairKit")).toBe(true);
    expect([hangar.count("repairKit"), hangar.count("scrap"), hangar.count("wiring")]).toEqual([1, 1, 0]);
    hangar.stow({ items: [], blueprints: ["recipe:nozzle"] });
    expect(hangar.craft("nozzle")).toBe(true);
    expect(hangar.recycle("nozzle")).toBe(ITEMS.nozzle.value);
    expect(hangar.recycle("nozzle")).toBe(0);
  });

  test("a fault is fixed with its own part first, then from salvage, then a repair kit; consumables come back as effects", () => {
    const hangar = hangarWith({ scrap: 2, wiring: 1, repairKit: 1, fuelCell: 1, hullPlate: 1 });

    expect(hangar.fixFor("misfire")).toEqual([{ id: "scrap", count: 2 }, { id: "wiring", count: 1 }]);
    expect(hangar.repair({ id: 4, kind: "misfire" })).toEqual([{ kind: "fix", fault: 4 }]);
    expect(hangar.fixFor("emitter")).toEqual([{ id: "repairKit", count: 1 }]);
    const flying = { isFlying: true, faults: [], hull: 1, fuel: 1, shields: 1, heat: 0 };

    expect(hangar.suggest({ ...flying, faults: [{ id: 9, kind: "glitch" }] })).toEqual({ kind: "repair", fault: 9, faultKind: "glitch" });
    expect(hangar.suggest({ ...flying, fuel: 0.1 })).toEqual({ kind: "use", item: "fuelCell", reason: "fuel" });
    expect(hangar.use("fuelCell")).toEqual([{ kind: "fuel", share: 0.45 }]);
    expect(hangar.use("fuelCell")).toBeNull();
    expect(hangar.use("hullPlate")).toEqual([{ kind: "module", module: "hull", amount: 0.4 }]);
    expect(hangar.use("scrap")).toBeNull();
  });

  test("a profile is kept in the browser checked, read back the same, and wiped on request", async () => {
    const repository = new PilotRepository(new MemoryAdapter());
    const hangar = hangarWith({ scrap: 2 }, { coin: 40 });

    const whole = { ...hangar.toProfile(), career: newCareer(), armory: newArmoryProfile(), progress: newProgressProfile() };

    expect(isPilotProfile(whole)).toBe(true);
    expect(isPilotProfile({ ...whole, level: -1 })).toBe(false);
    expect(await repository.save(whole)).toBe(true);

    const back = new Hangar(await repository.load());

    expect([back.purse, back.count("scrap")]).toEqual([{ RED: 40, VOID: 0 }, 2]);

    await repository.clear();
    expect(await repository.load()).toEqual(newProfile());

    back.reset();
    // Starting over is a new pilot: no money, a Rocket Mk I, and the starter kit in the hold.
    expect([back.purse, back.count("scrap"), back.count("repairKit"), back.level]).toEqual([{ RED: 0, VOID: 0 }, 4, 1, 0]);
  });

  test("a ledger with an entry it can no longer accept keeps every other coin", () => {
    const wallet = Wallet.open();

    wallet.earn("boss", { RED: 250 }, "boss", 1);
    wallet.earn("landing", { RED: 25 }, "landing:Mars", 2);

    const snapshot = wallet.toSnapshot();
    const broken = { ...snapshot, journal: [...snapshot.journal, { ...snapshot.journal[0], id: "bad", postings: [{ account: "nowhere", currency: "RED", amount: 9 }] }] };

    expect(Wallet.from(broken).purse.RED).toBe(275);
  });

  test("nothing can be made and broken down for more than it cost", () => {
    RECIPES.forEach((recipe) => {
      const cost = recipe.coin + recipe.needs.reduce((sum, need) => sum + ITEMS[need.id].value * need.count, 0);

      expect(ITEMS[recipe.makes.id].value * recipe.makes.count).toBeLessThan(cost);
    });
  });

  test("breaking down is written in the ledger as recycling, and the suggestion stays the same object while nothing changes", () => {
    const hangar = hangarWith({ scrap: 2, wiring: 1, fuelCell: 1 });
    const flying = { isFlying: true, faults: [], hull: 1, fuel: 0.1, shields: 1, heat: 0 };
    const first = hangar.suggest(flying);

    expect(hangar.suggest({ ...flying })).toBe(first);
    hangar.recycle("scrap");
    expect(hangar.view().history[0].memo).toBe("recycling:scrap");
    expect(hangar.suggest(flying)).not.toBe(first);
  });

  test("a profile from an older release with fewer records is still read, and another tab's newer save can be taken on", () => {
    const profile = { ...hangarWith({ scrap: 4 }, { coin: 30 }).toProfile(), career: newCareer(), armory: newArmoryProfile(), progress: newProgressProfile() };
    const older = Object.fromEntries(Object.entries(profile.records).filter(([key]) => key !== "salvaged"));

    expect(isPilotProfile({ ...profile, records: older })).toBe(true);
    expect(isPilotProfile({ ...profile, savedAt: undefined })).toBe(false);

    const other = hangarWith();

    other.replace(profile);
    expect([other.purse.RED, other.count("scrap")]).toEqual([30, 4]);
  });

  test("a new pilot starts with a starter kit: a repair kit, a fuel cell, and scrap and wiring for field repairs", () => {
    const hangar = new Hangar(newProfile());

    expect(["repairKit", "fuelCell", "scrap", "wiring"].map((id) => hangar.count(id))).toEqual([1, 1, 4, 2]);
    expect(hangar.fixFor("misfire")).toEqual([{ id: "scrap", count: 2 }, { id: "wiring", count: 1 }]);
  });

  test("a fault the hold cannot fix as it is is fixed by first making its part from a known plan", () => {
    const hangar = hangarWith({ scrap: 2, carbon: 1 }, { coin: 10 });

    expect(hangar.fixFor("fuelLeak")).toEqual([{ id: "scrap", count: 1 }, { id: "carbon", count: 1 }]);

    const kitOnly = hangarWith({ scrap: 3, wiring: 1 }, { coin: 10 });

    expect(kitOnly.repairPlan("emitter")).toEqual({ craft: "repairKit", parts: [{ id: "repairKit", count: 1 }] });
    expect(kitOnly.repair({ id: 1, kind: "emitter" })).toEqual([{ kind: "fix", fault: 1 }]);
    expect([kitOnly.count("repairKit"), kitOnly.count("scrap")]).toEqual([0, 0]);
    expect(hangarWith().repairPlan("breach")).toBeNull();
  });
});

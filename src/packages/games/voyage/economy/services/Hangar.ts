import { sumBy } from "@/packages/math/stats";

import { DEFAULT_VOYAGE_CONFIG, VoyageConfig } from "../../config";
import { LEVEL_FINDS } from "../../config/boosts";
import { BoostId } from "../../domain/boosts";
import { FaultKind, ShipEffect } from "../../domain/faults";
import { boostColour, isBoostId, levelForFinds } from "../../utils/boosts";
import { BAR_SLOTS, MAX_CHARGES, newBar } from "../config/bar";
import { ITEMS } from "../config/catalog";
import { FAULT_FIXES, recipeBlueprint, recipeById, RECIPES, UNIVERSAL_FIX } from "../config/recipes";
import { REWARDS, VOID_PRICE } from "../config/rewards";
import { cargoFor, clampLevel, configForLevel, markOf, tierOf } from "../config/tiers";
import { upgradeCost } from "../config/upgrades";
import { Backpack } from "../core/Backpack";
import { emptyPurse, Wallet } from "../core/Wallet";
import {
  BarRow, BoostFind, BoostRow, CargoRow, Cost, CurrencyCode, Deed, EconomyView, Purse, Recipe, ShipStats, ShipStatus, Shortfall, Stowed, Suggestion,
} from "../domain/economy";
import { ItemSpec, ItemStack, Loot } from "../domain/items";
import { BarSlot, BoostRecord, EconomyProfile, KeptSlot, PilotRecords } from "../domain/profile";

// How many ledger entries the UI is shown.
const HISTORY = 30;
// Below these shares, a consumable that helps is suggested.
const LOW = { hull: 0.35, fuel: 0.2, shields: 0.15, heat: 0.85 };
// Faults by how urgently they want fixing.
const URGENCY: readonly FaultKind[] = ["breach", "misfire", "emitter", "fuelLeak", "coolantLeak", "glitch"];
// How much of a system a part fitted without a fault restores.
const PART_SHARE = 0.4;

interface HangarCache {
  revision: number;
  next: EconomyView["next"] | undefined;
  statusKey: string | null;
  suggestion: Suggestion | null | undefined;
}

// What about the ship can change the suggestion: whether it flies, its faults, and which needs are low.
const statusKeyOf = (status: ShipStatus | null): string => (status
  ? `${status.isFlying ? 1 : 0}|${status.faults.map((fault) => fault.id).join(",")}|${status.hull < LOW.hull ? 1 : 0}${status.fuel < LOW.fuel ? 1 : 0}` +
    `${status.shields < LOW.shields ? 1 : 0}${status.heat > LOW.heat ? 1 : 0}`
  : "none");

interface Exchange {
  currency: CurrencyCode;
  amount: number;
}

export const newRecords = (): PilotRecords => ({ runs: 0, bestScore: 0, universes: 0, bosses: 0, rescues: 0, salvaged: 0 });

// A hangar that has never flown: a Rocket Mk I with a starter kit in the hold (a repair kit, a fuel cell, and the
// scrap and wiring field repairs are made of), the plans everyone knows, no money.
export const STARTER_KIT: readonly ItemStack[] = [{ id: "repairKit", count: 1 }, { id: "fuelCell", count: 1 }, { id: "scrap", count: 4 }, { id: "wiring", count: 2 }];

export const newEconomyProfile = (): EconomyProfile => ({
  savedAt: 0,
  level: 0,
  cargo: STARTER_KIT.map((stack) => ({ ...stack })),
  blueprints: [],
  ledger: Wallet.open().toSnapshot(),
  records: newRecords(),
  boosts: {},
  bar: newBar(),
});

export interface HangarOptions {
  now?: () => number;
  catalog?: Readonly<Record<string, ItemSpec>>;
  // The config a Rocket Mk I flies with, which every level's stats grow from.
  base?: VoyageConfig;
}

// The economy between and during runs: the hold, the wallet, the plans found and the ship's level. Deeds pay
// into the ledger; finds go in the hold; plans are learned; the hold's salvage is crafted into parts, fitted to
// fix faults, used in flight, or broken down for coin; and when everything a level needs is there, the ship is
// upgraded in one click. It never touches a run itself: what it does to the ship comes back as effects for the
// simulation to apply. Listeners hear every change, to save it and show it.
export class Hangar {
  private readonly catalog: Readonly<Record<string, ItemSpec>>;
  private readonly now: () => number;
  private readonly listeners = new Set<() => void>();
  private readonly base: VoyageConfig;
  private backpack: Backpack;
  private wallet: Wallet;
  private known: Set<string>;
  private shipLevel: number;
  private records: PilotRecords;
  private boosts: Map<BoostId, BoostRecord>;
  private bar: Array<BarSlot | null>;
  // Counts every change, so what is worked out from the hangar (the next upgrade, the suggestion) is worked out
  // once per change rather than on every tick that asks.
  private revision = 0;
  private cache: HangarCache = { revision: -1, next: undefined, statusKey: null, suggestion: undefined };

  constructor(profile: EconomyProfile, { now = Date.now, catalog = ITEMS, base = DEFAULT_VOYAGE_CONFIG }: HangarOptions = {}) {
    this.catalog = catalog;
    this.now = now;
    this.base = base;
    this.shipLevel = clampLevel(profile.level);
    this.backpack = new Backpack(cargoFor(this.shipLevel), profile.cargo, catalog);
    this.wallet = Wallet.from(profile.ledger);
    this.known = new Set(profile.blueprints);
    this.records = { ...newRecords(), ...profile.records };
    this.boosts = boostsOf(profile.boosts);
    this.bar = this.barOf(profile.bar);
  }

  public get level(): number {
    return this.shipLevel;
  }

  public get purse(): Purse {
    return this.wallet.purse;
  }

  // Starts over as a pilot who has never flown.
  public reset(): void {
    this.replace(newEconomyProfile());
  }

  // Takes on a profile written elsewhere (another tab's newer save), dropping what this one held.
  public replace(profile: EconomyProfile): void {
    this.shipLevel = clampLevel(profile.level);
    this.backpack = new Backpack(cargoFor(this.shipLevel), profile.cargo, this.catalog);
    this.wallet = Wallet.from(profile.ledger);
    this.known = new Set(profile.blueprints);
    this.records = { ...newRecords(), ...profile.records };
    this.boosts = boostsOf(profile.boosts);
    this.bar = this.barOf(profile.bar);
    this.changed();
  }

  public count(id: string): number {
    return this.backpack.count(id);
  }

  public knows(blueprint: string): boolean {
    return this.known.has(blueprint);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  // Pays for a deed, and counts it in the records; returns what it paid.
  public reward(deed: Deed): Purse {
    const paid = this.payFor(deed);

    if (deed.kind === "boss") {
      this.records.bosses += 1;
    } else if (deed.kind === "rescue") {
      this.records.rescues += 1;
    } else if (deed.kind === "universe") {
      this.records.universes = Math.max(this.records.universes, deed.index + 1);
    }

    this.wallet.earn(deed.kind, paid, memo(deed.kind, detailOf(deed)), this.now());
    this.changed();

    return paid;
  }

  // Puts a find in the hold as far as there is room, learns any plans new to the pilot and is paid for copies of
  // those already known.
  public stow(loot: Loot): Stowed {
    const kept: ItemStack[] = [];
    const lost: ItemStack[] = [];

    loot.items.forEach(({ id, count }) => {
      const added = this.backpack.add(id, count);

      if (added > 0) {
        kept.push({ id, count: added });
      }

      if (added < count) {
        lost.push({ id, count: count - added });
      }
    });

    const fresh = loot.blueprints.filter((blueprint) => !this.known.has(blueprint) && !this.isBuiltIn(blueprint));
    const copies = loot.blueprints.length - fresh.length;

    fresh.forEach((blueprint) => this.known.add(blueprint));

    if (copies > 0) {
      this.wallet.earn("salvage", { RED: REWARDS.knownBlueprint.RED * copies }, memo("blueprintCopy", String(copies)), this.now());
    }

    if (kept.length > 0 || fresh.length > 0) {
      this.records.salvaged += 1;
    }

    this.changed();

    return { kept, lost, blueprints: fresh, paid: REWARDS.knownBlueprint.RED * copies };
  }

  // The next level up, what it costs, what is short of it and what the ship will be; null at the top.
  public nextUpgrade(): EconomyView["next"] {
    const cache = this.current();

    if (cache.next === undefined) {
      const level = this.shipLevel + 1;
      const cost = upgradeCost(level);

      cache.next = cost ? { level, tier: tierOf(level), mark: markOf(level), cost, shortfall: this.shortfall(cost), stats: this.statsFor(level) } : null;
    }

    return cache.next;
  }

  // What a ship at a level can do.
  public statsFor(level: number): ShipStats {
    const { ship, thermal, arms } = configForLevel(this.base, level);

    return {
      hull: ship.hull,
      shields: ship.shields,
      fuel: ship.fuel,
      thrust: Math.round((ship.thrust / this.base.ship.thrust) * 100) / 100,
      cargo: cargoFor(level),
      plating: thermal.ratings.hull,
      pressure: thermal.pressureBar,
      guns: Math.round(arms.damage),
      weapon: arms.kind,
    };
  }

  // Takes the ship up a level if everything it needs is here; returns the new level, or null.
  public upgrade(): number | null {
    const next = this.nextUpgrade();

    if (!next?.shortfall.isReady || !this.wallet.spend("upgrade", next.cost.coin, memo("upgrade", String(next.level)), this.now())) {
      return null;
    }

    this.backpack.take(next.cost.items);
    this.shipLevel = next.level;
    this.backpack.resize(cargoFor(next.level));
    this.changed();

    return next.level;
  }

  // Makes one of a recipe from the hold, if its plan is known and everything is here and fits.
  public craft(id: string): boolean {
    const recipe = recipeById(id);

    if (!recipe || !this.isKnown(recipe) || !this.shortfall(costOf(recipe)).isReady) {
      return false;
    }

    const made = this.catalog[recipe.makes.id];
    const room = this.backpack.free + sumBy(recipe.needs, (need) => (this.catalog[need.id]?.volume ?? 0) * need.count);

    if (!made || made.volume * recipe.makes.count > room || !this.wallet.spend("crafting", { RED: recipe.coin }, memo("craft", id), this.now())) {
      return false;
    }

    this.backpack.take(recipe.needs);
    this.backpack.add(recipe.makes.id, recipe.makes.count);
    this.changed();

    return true;
  }

  // Breaks things down for their worth in Red Coin; returns what it paid.
  public recycle(id: string, count = 1): number {
    const spec = this.catalog[id];
    const taken = Math.min(count, this.backpack.count(id));

    if (!spec || taken <= 0 || !this.backpack.take([{ id, count: taken }])) {
      return 0;
    }

    const paid = spec.value * taken;

    this.wallet.earn("recycling", { RED: paid }, memo("recycling", id), this.now());
    this.changed();

    return paid;
  }

  // What would fix a fault from the hold now: its own part, a field repair from salvage, or a repair kit; null
  // when none of them is here.
  public fixFor(kind: FaultKind): readonly ItemStack[] | null {
    return [...FAULT_FIXES[kind], UNIVERSAL_FIX].find((option) => this.backpack.has(option)) ?? null;
  }

  // How a fault would be fixed from the hold now: with what is there, or by first making its part (or a repair
  // kit) from a known plan; null when neither can be done.
  public repairPlan(kind: FaultKind): { craft: string | null; parts: readonly ItemStack[] } | null {
    const parts = this.fixFor(kind);

    if (parts) {
      return { craft: null, parts };
    }

    const options = [...FAULT_FIXES[kind], UNIVERSAL_FIX].filter((option) => option.length === 1 && option[0].count === 1);
    const option = options.find((candidate) => this.craftableFor(candidate) !== null);
    const craft = option ? this.craftableFor(option) : null;

    return option && craft ? { craft, parts: option } : null;
  }

  // Takes what fixes a fault, making its part first where that is the way, and returns the effects for the ship;
  // null when nothing here fixes it.
  public repair(fault: { id: number; kind: FaultKind }): ShipEffect[] | null {
    const plan = this.repairPlan(fault.kind);

    if (!plan || (plan.craft !== null && !this.craft(plan.craft)) || !this.backpack.take(plan.parts)) {
      return null;
    }

    this.changed();

    return [{ kind: "fix", fault: fault.id }];
  }

  // What a thing would do used now, without taking it.
  public effectsFor(id: string): ShipEffect[] {
    const spec = this.catalog[id];

    return spec ? effectsOf(spec) : [];
  }

  // Uses a consumable, or fits a spare part to the system it mends, and returns its effects; null when there is
  // none in the hold or it does nothing.
  public use(id: string): ShipEffect[] | null {
    const spec = this.catalog[id];
    const effects = spec ? effectsOf(spec) : [];

    if (effects.length === 0 || !this.backpack.take([{ id, count: 1 }])) {
      return null;
    }

    this.changed();

    return effects;
  }

  // A boost's core picked up: a charge more (up to the most the ship carries) and a find towards its next level.
  // The first of a boost takes the first empty slot of the bar.
  public findBoost(id: BoostId): BoostFind {
    const before = this.boosts.get(id) ?? { charges: 0, finds: 0 };
    const after = { charges: Math.min(MAX_CHARGES, before.charges + 1), finds: before.finds + 1 };
    const isFirst = before.finds === 0;
    const level = levelForFinds(after.finds);

    this.boosts.set(id, after);

    const empty = this.bar.indexOf(null);

    if (isFirst && empty >= 0 && !this.bar.some((slot) => slot?.kind === "boost" && slot.id === id)) {
      this.bar[empty] = { kind: "boost", id };
    }

    this.changed();

    return { level, charges: after.charges, isFirst, isLevelUp: !isFirst && level > levelForFinds(before.finds) };
  }

  public boostLevel(id: BoostId): number {
    return levelForFinds(this.boosts.get(id)?.finds ?? 0);
  }

  public boostCharges(id: BoostId): number {
    return this.boosts.get(id)?.charges ?? 0;
  }

  // Takes one of a boost's charges once it has been set off; false when there is none.
  public spendBoost(id: BoostId): boolean {
    const record = this.boosts.get(id);

    if (!record || record.charges <= 0) {
      return false;
    }

    this.boosts.set(id, { ...record, charges: record.charges - 1 });
    this.changed();

    return true;
  }

  public slot(index: number): BarSlot | null {
    return this.bar[index] ?? null;
  }

  // Puts a boost or a usable thing in a slot of the bar, or empties it. Something already on the bar moves, and
  // what the slot held takes its place. Only boosts that have been found and things that do something fit.
  public setSlot(index: number, slot: BarSlot | null): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= BAR_SLOTS || (slot !== null && !this.fits(slot))) {
      return false;
    }

    const from = slot ? this.bar.findIndex((held) => held?.kind === slot.kind && held.id === slot.id) : -1;

    if (from >= 0) {
      this.bar[from] = this.bar[index];
    }

    this.bar[index] = slot ? { ...slot } : null;
    this.changed();

    return true;
  }

  // Sells Void Shards for Red Coin, or buys them, at the hangar's rates.
  public trade(direction: "sell" | "buy", shards = 1): boolean {
    const isSell = direction === "sell";
    const coin = shards * (isSell ? VOID_PRICE.sell : VOID_PRICE.buy);
    const shardSide: Exchange = { currency: "VOID", amount: shards };
    const coinSide: Exchange = { currency: "RED", amount: coin };
    const [give, get] = isSell ? [shardSide, coinSide] : [coinSide, shardSide];
    const isDone = this.wallet.exchange(give, get, memo(isSell ? "sellVoid" : "buyVoid", String(shards)), this.now());

    if (isDone) {
      this.changed();
    }

    return isDone;
  }

  // A run is over: paid for its points, and counted.
  public endRun(score: number): number {
    const paid = Math.floor(score / REWARDS.pointsPerCoin);

    this.records.runs += 1;
    this.records.bestScore = Math.max(this.records.bestScore, score);

    if (paid > 0) {
      this.wallet.earn("flight", { RED: paid }, memo("flight", String(score)), this.now());
    }

    this.changed();

    return paid;
  }

  // The one thing most worth doing now, ready in one click: a fault fixed, a part made to fix one, a consumable
  // used when the ship needs it, the next upgrade, or what the upgrade still wants made.
  // The same object comes back while nothing that decides it has changed, so callers can compare by identity.
  public suggest(status: ShipStatus | null): Suggestion | null {
    const cache = this.current();
    const statusKey = statusKeyOf(status);

    if (cache.suggestion === undefined || cache.statusKey !== statusKey) {
      cache.statusKey = statusKey;
      cache.suggestion = this.suggestNow(status);
    }

    return cache.suggestion;
  }

  // Everything the UI shows, as plain data.
  public view(status: ShipStatus | null = null): EconomyView {
    const level = this.shipLevel;

    return {
      level,
      tier: tierOf(level),
      mark: markOf(level),
      stats: this.statsFor(level),
      purse: this.wallet.purse,
      cargo: this.backpack.toStacks().map(({ id, count }) => this.row(id, count))
.filter((row): row is CargoRow => row !== null),
      capacity: this.backpack.capacity,
      used: this.backpack.used,
      blueprints: [...this.known],
      next: this.nextUpgrade(),
      recipes: RECIPES.map((recipe) => ({ recipe, isKnown: this.isKnown(recipe), shortfall: this.shortfall(costOf(recipe)) })),
      history: this.wallet.history(HISTORY),
      prices: { ...VOID_PRICE },
      suggestion: this.suggest(status),
      repairs: (status?.faults ?? []).map(({ id, kind }) => {
        const plan = this.repairPlan(kind);

        return {
          fault: id,
          kind,
          parts: plan ? [...plan.parts] : null,
          craft: plan?.craft ?? null,
          options: [...FAULT_FIXES[kind], UNIVERSAL_FIX].map((option) => [...option]),
        };
      }),
      records: { ...this.records },
      bar: this.bar.map((slot) => this.barRow(slot)),
      boosts: [...this.boosts].map(([id, record]) => boostRow(id, record)),
    };
  }

  public toProfile(): EconomyProfile {
    return {
      savedAt: this.now(),
      level: this.shipLevel,
      cargo: this.backpack.toStacks(),
      blueprints: [...this.known],
      ledger: this.wallet.toSnapshot(),
      records: { ...this.records },
      boosts: Object.fromEntries([...this.boosts].map(([id, record]) => [id, { ...record }])),
      bar: this.bar.map((slot) => (slot ? { ...slot } : null)),
    };
  }

  private suggestNow(status: ShipStatus | null): Suggestion | null {
    if (status?.isFlying) {
      const faults = [...status.faults].sort((first, second) => URGENCY.indexOf(first.kind) - URGENCY.indexOf(second.kind));
      const fixable = faults.find((fault) => this.repairPlan(fault.kind));

      if (fixable) {
        return { kind: "repair", fault: fixable.id, faultKind: fixable.kind };
      }

      const use = this.consumableFor(status);

      if (use) {
        return use;
      }
    }

    const next = this.nextUpgrade();

    if (next?.shortfall.isReady) {
      return { kind: "upgrade", level: next.level, tier: next.tier, mark: next.mark };
    }

    const towards = next ? this.craftableFor(next.shortfall.items) : null;

    return towards ? { kind: "craft", recipe: towards, reason: "upgrade" } : null;
  }

  private payFor(deed: Deed): Purse {
    switch (deed.kind) {
      case "discovery":
        return { ...REWARDS.discovery };
      case "landing":
        return { ...REWARDS.landing };
      case "hosted":
        return { ...REWARDS.hosted };
      case "bounty":
        return { ...emptyPurse(), RED: REWARDS.bountyPerLevel * Math.max(1, deed.level) };
      case "rescue":
        return { ...(deed.isDeflected ? REWARDS.deflection : REWARDS.rescue) };
      case "boss":
        return { ...REWARDS.boss };
      case "universe":
        return { ...REWARDS.universe };
      case "mission":
        return { RED: Math.max(0, Math.round(deed.coin)), VOID: 0 };
      case "coin":
        return { RED: REWARDS.coin.RED * Math.max(0, deed.count), VOID: REWARDS.coin.VOID * Math.max(0, deed.count) };
      default:
        return emptyPurse();
    }
  }

  private isBuiltIn(blueprint: string): boolean {
    return RECIPES.some((recipe) => recipe.isKnown && recipeBlueprint(recipe.id) === blueprint);
  }

  private isKnown(recipe: Recipe): boolean {
    return recipe.isKnown || this.known.has(recipeBlueprint(recipe.id));
  }

  private shortfall(cost: Cost): Shortfall {
    const purse = this.wallet.purse;
    const coin = { RED: Math.max(0, cost.coin.RED - purse.RED), VOID: Math.max(0, cost.coin.VOID - purse.VOID) };
    const items = this.backpack.missing(cost.items);
    const blueprint = cost.blueprint && !this.known.has(cost.blueprint) ? cost.blueprint : null;

    return { coin, items, blueprint, isReady: coin.RED === 0 && coin.VOID === 0 && items.length === 0 && blueprint === null };
  }

  // A known recipe that makes one of `wanted` and can be made now.
  private craftableFor(wanted: readonly ItemStack[]): string | null {
    const recipe = RECIPES.find((entry) => wanted.some((want) => want.id === entry.makes.id) && this.isKnown(entry) && this.shortfall(costOf(entry)).isReady);

    return recipe?.id ?? null;
  }

  private consumableFor(status: ShipStatus): Suggestion | null {
    const wants: Array<{ item: string; reason: "hull" | "fuel" | "shields" | "heat"; isLow: boolean }> = [
      { item: "repairKit", reason: "hull", isLow: status.hull < LOW.hull },
      { item: "coolantFlask", reason: "heat", isLow: status.heat > LOW.heat },
      { item: "fuelCell", reason: "fuel", isLow: status.fuel < LOW.fuel },
      { item: "shieldCell", reason: "shields", isLow: status.shields < LOW.shields },
    ];
    const want = wants.find((option) => option.isLow && this.backpack.count(option.item) > 0);

    return want ? { kind: "use", item: want.item, reason: want.reason } : null;
  }

  // Whether something can go on the bar: a boost found, or a thing in the catalogue that does something used.
  private fits(slot: BarSlot): boolean {
    if (slot.kind === "boost") {
      return this.boosts.has(slot.id);
    }

    const spec = this.catalog[slot.id];

    return spec !== undefined && effectsOf(spec).length > 0;
  }

  // A bar read back from a profile: always four slots, each kept only while it still names something that fits.
  private barOf(bar: ReadonlyArray<KeptSlot | null>): Array<BarSlot | null> {
    return Array.from({ length: BAR_SLOTS }, (_, index) => {
      const kept = bar[index] ?? null;
      const slot: BarSlot | null = !kept ? null : kept.kind === "item" ? { kind: "item", id: kept.id } : isBoostId(kept.id) ? { kind: "boost", id: kept.id } : null;

      return slot && this.fits(slot) ? slot : null;
    });
  }

  private barRow(slot: BarSlot | null): BarRow {
    if (!slot) {
      return { slot: null, count: 0, level: 0, colour: null };
    }

    return slot.kind === "boost"
      ? { slot: { ...slot }, count: this.boostCharges(slot.id), level: this.boostLevel(slot.id), colour: boostColour(slot.id) }
      : { slot: { ...slot }, count: this.backpack.count(slot.id), level: 0, colour: null };
  }

  private row(id: string, count: number): CargoRow | null {
    const spec = this.catalog[id];

    return spec ? { id, count, rarity: spec.rarity, volume: spec.volume, value: spec.value, isUsable: effectsOf(spec).length > 0, mends: spec.mends ?? null } : null;
  }

  // What is worked out from the hangar as it stands now.
  private current(): HangarCache {
    if (this.cache.revision !== this.revision) {
      this.cache = { revision: this.revision, next: undefined, statusKey: null, suggestion: undefined };
    }

    return this.cache;
  }

  private changed(): void {
    this.revision += 1;
    this.listeners.forEach((listener) => listener());
  }
}

// The boosts kept in a profile, leaving out any name the boosts no longer know.
const boostsOf = (boosts: EconomyProfile["boosts"]): Map<BoostId, BoostRecord> => {
  const kept = new Map<BoostId, BoostRecord>();

  Object.entries(boosts).forEach(([id, record]) => {
    if (isBoostId(id)) {
      kept.set(id, { charges: Math.min(MAX_CHARGES, record.charges), finds: record.finds });
    }
  });

  return kept;
};

const boostRow = (id: BoostId, { charges, finds }: BoostRecord): BoostRow => ({
  id,
  colour: boostColour(id),
  charges,
  max: MAX_CHARGES,
  finds,
  level: levelForFinds(finds),
  nextAt: LEVEL_FINDS.find((needed) => needed > finds) ?? null,
});

const costOf = (recipe: Recipe): Cost => ({ coin: { RED: recipe.coin, VOID: 0 }, items: recipe.needs, blueprint: null });

const memo = (kind: string, detail?: string) => (detail ? `${kind}:${detail}` : kind);

const detailOf = (deed: Deed): string => {
  switch (deed.kind) {
    case "discovery":
    case "landing":
    case "hosted":
      return deed.place;
    case "bounty":
      return String(deed.level);
    case "rescue":
      return deed.target;
    case "boss":
      return deed.name;
    case "universe":
      return String(deed.index);
    case "mission":
      return deed.id;
    case "coin":
      return String(deed.count);
    default:
      return "";
  }
};

// What a thing does used in flight: a consumable's own effect; a spare part fitted to the system it mends.
const effectsOf = (spec: ItemSpec): ShipEffect[] => {
  if (spec.use) {
    switch (spec.use.kind) {
      case "repair":
        return [{ kind: "hull", share: spec.use.hull }, { kind: "module", module: "worst", amount: spec.use.module }];
      case "fuel":
        return [{ kind: "fuel", share: spec.use.share }];
      case "shields":
        return [{ kind: "shields", share: spec.use.share }];
      case "coolant":
        return [{ kind: "cool", degrees: spec.use.degrees }];
      default:
        return [];
    }
  }

  return spec.mends ? [{ kind: "module", module: spec.mends, amount: PART_SHARE }] : [];
};


import { MemoryAdapter } from "@/packages/browser/store";
import {
  ACHIEVEMENTS,
  armedWeapon,
  Armory,
  armoryView,
  CatalogLootTable,
  configForShip,
  DEFAULT_VOYAGE_CONFIG,
  ENHANCE_LADDER,
  GEAR_LEVELS,
  Hangar,
  isPilotProfile,
  loadoutStats,
  newArmoryProfile,
  newBar,
  newProfile,
  newProgressProfile,
  PilotRepository,
  Progress,
  ProgressLink,
  rackFor,
  STARTER_AMMO,
  VoyageNotice,
  VoyageSimulation,
  VoyageState,
  weaponBaseId,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

import { createFlying, defaults, partsOf } from "./fixtures/simulation";

const always = () => 0;
const never = () => 0.999;

// A pilot whose hangar holds `cargo` and `coin` Red Coin, with an armoury and progress, joined as the host joins them.
const pilotWith = (cargo: Record<string, number> = {}, coin = 0) => {
  const armory = new Armory();
  const progress = new Progress();
  const hangar = new Hangar({ ...newProfile(), cargo: Object.entries(cargo).map(([id, count]) => ({ id, count })) }, { weapons: armory.port() });

  if (coin > 0) {
    hangar.reward({ kind: "mission", id: "test", coin });
  }

  return { armory, progress, hangar };
};

// Into a universe made from a seed, with its first faction made hostile; and someone of it spawned at a point.
const intoUniverse = (simulation: VoyageSimulation) => {
  const state = simulation.state as VoyageState;

  state.runSeed = 9000;
  state.universes = 5;
  state.phase = "lost";
  state.phaseMs = 1e9;
  simulation.step(defaults.stepMs * 2);
  state.cosmos?.factions.forEach((faction) => {
    faction.disposition = "hostile";
  });
};

const spawnHostile = (simulation: VoyageSimulation, x: number, y: number, hull = 400) => {
  const { world } = simulation;
  const entity = world.spawn();

  world.stores.body.set(entity, { x, y, vx: 0, vy: 0, prevX: x, prevY: y, radius: 0.1, mass: 1 });
  world.stores.health.set(entity, { hull, maxHull: hull, shields: 80, maxShields: 80, rechargeIn: 0, decals: [] });
  world.stores.alien.set(entity, { faction: 0, role: "fighter", mode: "idle", homeX: x, homeY: y, threat: 0, angle: 0, level: 3, phase: 0 });

  return entity;
};

// The ship somewhere quiet, at rest, pointing along +x.
const atRest = (simulation: VoyageSimulation) => {
  const { body, ship } = partsOf(simulation);
  const x = simulation.state.system.star.x + 26;
  const y = simulation.state.system.star.y;

  Object.assign(body, { x, y, prevX: x, prevY: y, vx: 0, vy: 0 });
  ship.angle = 0;

  return body;
};

describe("voyage gear", () => {
  test("a new pilot's rocket is fitted with its stock pieces and the main gun's rounds", () => {
    const armory = new Armory();

    expect(armory.pieces.length).toBe(7);
    expect(armory.fitted("armor")?.base).toBe("armor:0");
    expect(armory.fitted("wings")).toBeNull();
    expect(armory.stock).toEqual(STARTER_AMMO);
    expect(armory.stats().hull).toBeGreaterThan(0);
  });

  test("a piece fits only a slot the ship has grown, by its form and the pilot's level, and only at a grade the pilot is level for", () => {
    const armory = new Armory();
    const wings = armory.add({ base: "wings:0", rarity: "rare" });
    const plating = armory.add({ base: "armor:3", rarity: "common" });
    const gradeLevel = (grade: number) => [1, 15, 40, 80, 140, 220][grade];

    expect(wings && armory.equip(wings.uid, 0, 1, gradeLevel)).toBe(false);
    expect(wings && armory.equip(wings.uid, 5, 5, gradeLevel)).toBe(true);
    expect(plating && armory.equip(plating.uid, 20, 50, gradeLevel)).toBe(false);
    expect(plating && armory.equip(plating.uid, 20, 80, gradeLevel)).toBe(true);
    expect(armory.fitted("armor")?.uid).toBe(plating?.uid);
    expect(armory.add({ base: "nonsense:9", rarity: "common" })).toBeNull();
    // A fitted piece is not broken down.
    expect(plating && armory.dismantle(plating.uid)).toBeNull();
    expect(armory.unequip("armor")).toBe(true);
    expect(plating && armory.dismantle(plating.uid)?.base).toBe("armor:3");
  });

  test("enhancing is paid first, climbs a step on a success and falls back on a failure, kept by a stabiliser", () => {
    const armory = new Armory();
    const uid = armory.fitted("primary")?.uid ?? "";
    const paid: number[] = [];
    const pay = (cost: { coin: number }) => {
      paid.push(cost.coin);

      return true;
    };

    expect(armory.enhance(uid, () => false, always)).toBeNull();
    [1, 2, 3, 4, 5].forEach(() => armory.enhance(uid, pay, always));
    expect(armory.piece(uid)?.enhance).toBe(5);
    expect(armory.enhance(uid, pay, never)?.outcome).toBe("fell");
    expect(armory.piece(uid)?.enhance).toBe(2);
    expect(armory.enhance(uid, pay, never, true)?.outcome).toBe("kept");
    expect(paid.length).toBe(7);
    expect(paid[4]).toBeGreaterThan(paid[0]);
  });

  test("experience levels a piece, and each level, grade, rarity and step makes it stronger", () => {
    const armory = new Armory();
    const uid = armory.fitted("armor")?.uid ?? "";
    const before = armory.stats().hull ?? 0;

    expect(armory.gainExp(uid, GEAR_LEVELS.startOf(10))).toBe(9);
    expect(armory.stats().hull).toBeGreaterThan(before);

    const common = armory.add({ base: "armor:2", rarity: "common" });
    const legendary = armory.add({ base: "armor:2", rarity: "legendary" });

    expect(common && legendary && loadoutStats([legendary]).hull).toBeGreaterThan(common ? loadoutStats([common]).hull ?? 0 : Infinity);
    expect(ENHANCE_LADDER.bonusAt(30)).toBeGreaterThan(ENHANCE_LADDER.bonusAt(10));
  });

  test("the racks hold so much of each kind for the hull, and a fitted ship flies stronger and better with its pilot's level", () => {
    const armory = new Armory();
    // A rocket's rack of rounds is full from the start; a Shuttle's holds more.

    expect(armory.addAmmo({ rounds: 10000, missiles: 3 }, (type) => rackFor(type, 0))).toEqual({ missiles: 3 });
    expect(armory.addAmmo({ rounds: 10000 }, (type) => rackFor(type, 1))).toEqual({ rounds: rackFor("rounds", 1) - STARTER_AMMO.rounds });
    expect(rackFor("missiles", 5)).toBeGreaterThan(rackFor("missiles", 0));

    const bare = configForShip(DEFAULT_VOYAGE_CONFIG, 0, {}, 1);
    const fitted = configForShip(DEFAULT_VOYAGE_CONFIG, 0, { hull: 0.5, damage: 0.4, resist: 0.2, crit: 0.1 }, 100);

    expect(fitted.ship.hull).toBeGreaterThan(bare.ship.hull * 1.5);
    expect(fitted.arms.damage).toBeGreaterThan(bare.arms.damage * 1.4);
    expect([fitted.ship.resist, fitted.arms.crit]).toEqual([0.2, 0.1]);
    expect(loadoutStats([]).crit).toBe(0);
  });

  test("a weapon piece arms as its kind with its own power, and the bar knows its shots left", () => {
    const { armory, hangar } = pilotWith();
    const missile = armory.add({ base: weaponBaseId("missile", 2), rarity: "epic" });

    expect(missile && armedWeapon(missile)?.damage).toBeGreaterThan(90 * 1.9);
    expect(missile && hangar.setSlot(2, { kind: "weapon", id: missile.uid })).toBe(true);
    expect(hangar.view().bar[2]).toMatchObject({ slot: { kind: "weapon" }, count: 0 });
    armory.addAmmo({ missiles: 4 }, () => 99);
    expect(hangar.view().bar[2].count).toBe(4);
    expect(hangar.setSlot(3, { kind: "weapon", id: armory.fitted("armor")?.uid ?? "" })).toBe(false);
  });

  test("the armoury's view lists every piece with its next enhancement and the weapons that can be forged", () => {
    const { armory, hangar, progress } = pilotWith({ moonstone: 2 });
    const view = armoryView(armory, hangar, progress);
    const gun = view.pieces.find((piece) => piece.slot === "primary");

    expect(view.slots.find((slot) => slot.slot === "halo")?.isOpen).toBe(false);
    expect(gun?.next).toMatchObject({ material: "moonstone", count: 1, have: 2 });
    expect(view.forge.map((forge) => forge.kind)).toEqual(["missile", "mine", "railgun", "emp", "flak"]);
    expect(view.forge.every((forge) => !forge.isKnown && forge.grades.length === 1)).toBe(true);
  });

  test("progress counts, unlocks achievements and their paints, keeps the best stars and levels the pilot", () => {
    const progress = new Progress();

    expect(progress.record("runs").achievements).toEqual(["firstFlight"]);
    expect(progress.seen("landed", "moon", "landedWorlds").achievements).toContain("moonWalker");
    expect(progress.seen("landed", "moon", "landedWorlds").achievements).toEqual([]);
    expect(progress.record("kills", 250).cosmetics).toEqual(["ace"]);
    expect(progress.choose("paint", "ace")).toBe(true);
    expect(progress.choose("paint", "legend")).toBe(false);
    expect(progress.recordStars("u:0", 2).gained).toBe(2);
    expect(progress.recordStars("u:0", 1).gained).toBe(0);
    expect(progress.recordStars("u:0", 3).gained).toBe(1);
    expect(progress.counter("perfectUniverses")).toBe(1);

    const outcome = progress.gainExp(5000);

    expect(outcome.levels).toBeGreaterThan(5);
    expect(progress.counter("pilotLevel")).toBe(progress.level);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(ACHIEVEMENTS.map((spec) => spec.id)).size).toBe(ACHIEVEMENTS.length);
  });

  test("a boss's chest always holds gear, a wreck holds rounds, and a boss's hoard is never empty", () => {
    const table = new CatalogLootTable();
    const rolls = (source: "chest" | "wreck" | "boss") => Array.from({ length: 60 }, (_, seed) => table.roll({ source, style: null, universe: 2, level: 3 },
      createSeededRandom(seed + 1)));

    expect(rolls("chest").every((loot) => (loot.gear ?? []).length > 0)).toBe(true);
    expect(rolls("wreck").every((loot) => (loot.ammo?.rounds ?? 0) > 0)).toBe(true);
    expect(rolls("boss").every((loot) => loot.items.length > 0)).toBe(true);
  });

  test("a profile from before the armoury is fitted as a new pilot's rocket, its bar growing to six slots", async () => {
    const adapter = new MemoryAdapter();
    const { armory, progress, ...older } = { ...newProfile(), level: 7, bar: newBar().slice(0, 4) };

    expect([armory, progress]).toEqual([newArmoryProfile(), newProgressProfile()]);
    await adapter.set("pilot", { version: 3, data: older });

    const profile = await new PilotRepository(adapter).load();

    expect(isPilotProfile(profile)).toBe(true);
    expect(profile.level).toBe(7);
    expect(profile.armory.gear.length).toBe(7);
    expect(new Hangar(profile).view().bar.length).toBe(6);
  });
});

describe("voyage weapons in a run", () => {
  // One armoury for every weapon a test arms, so each piece has its own number.
  let armory = new Armory();

  beforeEach(() => {
    armory = new Armory();
  });

  const armed = (kind: "missile" | "mine" | "railgun" | "emp" | "flak") => {
    const piece = armory.add({ base: weaponBaseId(kind, 2), rarity: "common" });
    const weapon = piece ? armory.armed(piece.uid) : null;

    if (!weapon) {
      throw new Error("no weapon");
    }

    return weapon;
  };

  test("a weapon fires only from the bar, with ammunition, and not again until it is ready", () => {
    const simulation = createFlying();
    const flak = armed("flak");

    atRest(simulation);
    expect(simulation.fireWeapon(flak.uid)).toBe("unable");
    simulation.setArsenal([flak]);
    expect(simulation.fireWeapon(flak.uid)).toBe("empty");
    simulation.setAmmo({ ...STARTER_AMMO, shells: 2 });
    expect(simulation.fireWeapon(flak.uid)).toBe("fired");
    expect(simulation.state.ammo.shells).toBe(1);
    expect(simulation.world.stores.projectile.size).toBe(flak.pellets);
    expect(simulation.fireWeapon(flak.uid)).toBe("cooling");
  });

  test("a railgun pierces everyone in its line, an EMP strips shields, stuns and kills missiles, a missile needs a quarry", () => {
    const simulation = createFlying();

    intoUniverse(simulation);

    const body = atRest(simulation);
    const near = spawnHostile(simulation, body.x + 2, body.y);
    const far = spawnHostile(simulation, body.x + 5, body.y);
    const rail = armed("railgun");
    const emp = armed("emp");
    const missile = armed("missile");

    simulation.setArsenal([rail, emp, missile]);
    simulation.setAmmo({ ...STARTER_AMMO, slugs: 3, cells: 3, missiles: 3 });
    // Nobody is coming for the ship yet, so a missile has nothing to home on.
    expect(simulation.fireWeapon(missile.uid)).toBe("noTarget");
    expect(simulation.fireWeapon(rail.uid, { x: body.x + 10, y: body.y })).toBe("fired");
    [near, far].forEach((entity) => expect(simulation.world.stores.health.get(entity)?.shields ?? 0).toBeLessThan(80));

    const close = spawnHostile(simulation, body.x + 1, body.y + 1);

    expect(simulation.fireWeapon(emp.uid)).toBe("fired");
    expect(simulation.world.stores.health.get(close)?.shields).toBe(0);
    expect(simulation.world.stores.alien.get(close)?.stunnedUntil).toBeGreaterThan(simulation.state.elapsedMs);

    // Roused by the pulse, they are something to home on.
    expect(simulation.fireWeapon(missile.uid)).toBe("fired");
  });

  test("a mine waits until it is armed, then bursts as someone comes near", () => {
    const simulation = createFlying();

    intoUniverse(simulation);

    const body = atRest(simulation);
    const mine = armed("mine");

    simulation.setArsenal([mine]);
    simulation.setAmmo({ ...STARTER_AMMO, mines: 1 });
    expect(simulation.fireWeapon(mine.uid)).toBe("fired");

    const dropped = simulation.world.stores.body.get(simulation.world.stores.projectile.entities[0]);
    const victim = spawnHostile(simulation, (dropped?.x ?? 0) + 0.15, dropped?.y ?? body.y, 2000);

    simulation.step(100);
    expect(simulation.world.stores.health.get(victim)?.hull).toBe(2000);
    simulation.step(1000);
    expect(simulation.world.stores.health.get(victim)?.hull ?? 0).toBeLessThan(2000);
  });

  test("the main gun spends rounds, falls back to a weak backup shot on normal, and falls silent on hard", () => {
    const run = (difficulty: "normal" | "hard", rounds: number) => {
      const simulation = createFlying();
      const fired: Array<{ kind: string; ammo: string | null }> = [];

      simulation.events.on("fired", ({ kind, ammo, team }) => team === "ship" && fired.push({ kind, ammo }));
      intoUniverse(simulation);

      const body = atRest(simulation);
      const target = spawnHostile(simulation, body.x + 2, body.y, 5000);

      simulation.setDifficulty(difficulty);
      simulation.setAmmo({ ...STARTER_AMMO, rounds });
      simulation.lock(target);
      simulation.step(600);

      return { fired, rounds: simulation.state.ammo.rounds };
    };

    expect(run("normal", 50).fired.every((shot) => shot.ammo === "rounds")).toBe(true);
    expect(run("normal", 50).rounds).toBeLessThan(50);
    expect(run("normal", 0).fired.some((shot) => shot.kind === "backup")).toBe(true);
    expect(run("hard", 0).fired).toEqual([]);
  });

  test("by hand, the main gun fires only while the pilot fires, where they point", () => {
    const simulation = createFlying();
    let fired = 0;

    simulation.events.on("fired", ({ team }) => {
      fired += team === "ship" ? 1 : 0;
    });

    const body = atRest(simulation);

    simulation.setAimMode("manual");
    simulation.step(300);
    expect(fired).toBe(0);
    simulation.step(300, { aim: null, thrust: 0, turn: 0, brake: false, target: { x: body.x, y: body.y - 3 }, fire: true });
    expect(fired).toBeGreaterThan(0);
  });
});

describe("the progress link", () => {
  test("joins a run to the armoury and progress: shots spend the racks, deeds earn experience, finds bring gear and ammunition, and the end is summed up", () => {
    const simulation = createFlying();
    const { armory, progress, hangar } = pilotWith();
    const notices: VoyageNotice[] = [];
    const link = new ProgressLink({ simulation, hangar, armory, progress, notify: (notice) => notices.push(notice), refresh: () => undefined, refit: () => undefined });

    link.attach();
    simulation.start();
    link.startRun();
    expect(notices).toContainEqual({ kind: "achievement", id: "firstFlight" });

    simulation.events.emit("fired", { x: 0, y: 0, angle: 0, kind: "cannon", team: "ship", ammo: "rounds", source: null });
    expect(armory.ammoOf("rounds")).toBe(STARTER_AMMO.rounds - 1);

    link.deed({ kind: "universe", index: 4 });
    expect(notices.some((notice) => notice.kind === "levelUp")).toBe(true);
    expect(armory.fitted("primary")?.exp ?? 0).toBeGreaterThan(0);

    simulation.events.emit("salvaged", { wreck: 1, x: 0, y: 0, kind: "probe", loot: { items: [], blueprints: [], gear: [{ base: "wings:1", rarity: "rare" }],
      ammo: { missiles: 3 } } });
    expect(armory.pieces.some((piece) => piece.base === "wings:1")).toBe(true);
    expect(armory.ammoOf("missiles")).toBe(3);
    expect(simulation.state.ammo.missiles).toBe(3);

    (simulation.state as VoyageState).status = "over";
    link.tick({ ...simulation.snapshot, status: "over", score: 1200 });
    expect(link.summary).toMatchObject({ score: 1200, gear: [{ base: "wings:1", rarity: "rare" }], achievements: ["firstFlight"] });
    expect(link.summary?.exp).toBeGreaterThan(0);
  });
});

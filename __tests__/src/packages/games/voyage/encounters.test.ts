import { MemoryAdapter } from "@/packages/browser/store";
import {
  addStats,
  ammoFor,
  Armory,
  DEFAULT_VOYAGE_THEME,
  BOSS_MOVES,
  bossMoveFor,
  DEFAULT_VOYAGE_CONFIG,
  drawPerks,
  goodsFor,
  Hangar,
  isArmoryProfile,
  isProgressProfile,
  ITEMS,
  newProfile,
  novaDirections,
  NO_INPUT,
  PERKS,
  perkCount,
  perkStats,
  Port,
  PilotRepository,
  priceFactor,
  Progress,
  salePrice,
  salesFor,
  servicesFor,
  STARTER_AMMO,
  TELEGRAPH_MS,
  VoyageEvents,
  VoyageGame,
  VoyageRenderer,
  VoyageSimulation,
  VoyageState,
  windup,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

import { createFlying, defaults, partsOf } from "./fixtures/simulation";

const port = (overrides: Partial<Port> = {}): Port => ({ kind: "station", id: "station:earth", anchor: "earth", faction: -1, seed: 1234, depth: -1, ...overrides });

// Into a universe made from a seed, every faction there made hostile.
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

// The ship somewhere quiet, at rest.
const atRest = (simulation: VoyageSimulation) => {
  const { body } = partsOf(simulation);
  const x = simulation.state.system.star.x + 26;
  const y = simulation.state.system.star.y;

  Object.assign(body, { x, y, prevX: x, prevY: y, vx: 0, vy: 0 });

  return body;
};

// Every payload of one kind of event emitted while `run` runs.
const heard = <K extends keyof VoyageEvents>(simulation: VoyageSimulation, kind: K, run: () => void): Array<VoyageEvents[K]> => {
  const seen: Array<VoyageEvents[K]> = [];
  const off = simulation.events.on(kind, (payload) => seen.push(payload));

  run();
  off();

  return seen;
};

describe("run perks", () => {
  test("three are offered with none twice, and a perk at its most is never offered again", () => {
    const random = createSeededRandom(3);

    for (let draw = 0; draw < 20; draw += 1) {
      const offer = drawPerks(random, []);

      expect(offer).toHaveLength(3);
      expect(new Set(offer).size).toBe(3);
    }

    const maxed = PERKS.flatMap((perk) => (perk.id === "scavenger" ? [] : Array<typeof perk.id>(perk.max).fill(perk.id)));

    expect(drawPerks(random, maxed)).toEqual(["scavenger"]);
    expect(drawPerks(random, [...maxed, "scavenger"])).toEqual([]);
  });

  test("what the perks add is summed as gear is, each counted every time it was taken, and capped where gear is", () => {
    const stats = perkStats(["hotBarrels", "hotBarrels", "thickPlating"]);

    expect(stats.rate).toBeCloseTo(0.36, 6);
    expect(stats).toMatchObject({ hull: 0.25, plating: 0.1 });
    expect(perkCount(["vampire", "vampire", "scavenger"], "vampire")).toBe(2);
    expect(addStats({ crit: 0.45, resist: 0.55 }, { crit: 0.2, resist: 0.2, damage: 0.1 })).toEqual({ crit: 0.5, resist: 0.6, damage: 0.1 });
  });

  test("an offer holds the run still until a perk is taken, or none", () => {
    const simulation = createFlying();

    expect(simulation.offerPerks()).toBe(true);
    expect(simulation.offerPerks()).toBe(false);
    expect(simulation.isHeld).toBe(true);

    const before = simulation.state.elapsedMs;
    const offer = simulation.state.perkOffer ?? [];

    simulation.step(1000);
    expect(simulation.state.elapsedMs).toBe(before);
    expect(simulation.advance(500, NO_INPUT)).toBe(0);
    expect(simulation.choosePerk("vampire")).toBe(offer.includes("vampire"));

    simulation.choosePerk(offer[0]);
    expect(simulation.isHeld).toBe(false);
    expect(simulation.state.perks).toEqual([offer[0]]);

    simulation.step(100);
    expect(simulation.state.elapsedMs).toBeGreaterThan(before);
  });

  test("a new run starts with no perks", () => {
    const simulation = createFlying();

    simulation.offerPerks();
    simulation.choosePerk(simulation.state.perkOffer?.[0] ?? null);
    simulation.start();

    expect(simulation.state.perks).toEqual([]);
    expect(simulation.state.perkOffer).toBeNull();
  });
});

describe("ports", () => {
  test("stations keep their orbits round Earth, Mars, Jupiter and Saturn at home", () => {
    const simulation = createFlying();

    simulation.step(defaults.stepMs);

    const { stations, system } = simulation.state;

    expect(stations.map((station) => station.anchor)).toEqual(["earth", "mars", "jupiter", "saturn"]);
    stations.forEach((station) => {
      const world = system.bodies.find((body) => body.id === station.anchor);

      expect(world).toBeDefined();
      expect(Math.hypot(station.x - (world?.x ?? 0), station.y - (world?.y ?? 0))).toBeCloseTo(station.distance, 3);
    });

    const angle = stations[0].angle;

    simulation.step(1000);
    expect(simulation.state.stations[0].angle).toBeCloseTo(angle + stations[0].rate, 2);
  });

  test("a ship alongside a station slowly enough may dock, which holds the run still, and casting off pushes it clear", () => {
    const simulation = createFlying();

    simulation.step(defaults.stepMs);

    const station = simulation.state.stations[0];
    const { body } = partsOf(simulation);

    Object.assign(body, { x: station.x + 0.2, y: station.y, prevX: station.x + 0.2, prevY: station.y, vx: station.vx, vy: station.vy });
    simulation.step(defaults.stepMs);

    expect(simulation.state.dockable?.id).toBe(station.id);
    expect(simulation.snapshot.dockable).toEqual({ kind: "station", anchor: "earth", anchorName: null, faction: null });

    const docked = heard(simulation, "docked", () => expect(simulation.dock()).toBe(true));

    expect(docked).toEqual([{ kind: "station", id: station.id }]);
    expect(simulation.isHeld).toBe(true);

    const before = simulation.state.elapsedMs;

    simulation.step(1000);
    expect(simulation.state.elapsedMs).toBe(before);
    expect(simulation.undock()).toBe(true);
    expect(simulation.isHeld).toBe(false);
    expect(Math.hypot(body.vx - station.vx, body.vy - station.vy)).toBeGreaterThan(0.2);

    simulation.step(defaults.stepMs);
    expect(simulation.state.dockable).toBeNull();
  });

  test("going too fast against a station, nothing is offered", () => {
    const simulation = createFlying();

    simulation.step(defaults.stepMs);

    const station = simulation.state.stations[0];
    const { body } = partsOf(simulation);

    Object.assign(body, { x: station.x + 0.2, y: station.y, prevX: station.x + 0.2, prevY: station.y, vx: station.vx + 2, vy: station.vy });
    simulation.step(defaults.stepMs);

    expect(simulation.state.dockable).toBeNull();
    expect(simulation.dock()).toBe(false);
  });

  test("a port's goods come from its seed, only what is found that deep, a trader carrying less and dearer", () => {
    const home = goodsFor(port(), ITEMS);

    expect(goodsFor(port(), ITEMS)).toEqual(home);
    expect(home).toHaveLength(6);
    expect(home.some(({ id }) => id === "starShard" || id === "stabiliser" || id === "alloy")).toBe(false);
    home.forEach(({ id, price }) => expect(price).toBeGreaterThan(ITEMS[id].value));

    const trader = goodsFor(port({ kind: "trader", depth: 3 }), ITEMS);

    expect(trader).toHaveLength(4);
    expect(trader.some(({ id }) => id === "repairKit" || id === "stabiliser")).toBe(false);
    expect(priceFactor(port({ depth: 3 }))).toBeGreaterThan(priceFactor(port()));
    expect(priceFactor(port({ kind: "trader", depth: 3 }))).toBeGreaterThan(priceFactor(port({ depth: 3 })));
  });

  test("only a station's crew mend, refuel and charge, priced for what is missing; a trader sells only what its people fire", () => {
    const services = servicesFor(port(), { repair: 0.5, refuel: 0, recharge: 1 });

    expect(services.map(({ id, isNeeded }) => [id, isNeeded])).toEqual([["repair", true], ["refuel", false], ["recharge", true]]);
    expect(services[0].price).toBeGreaterThan(0);
    expect(services[1].price).toBe(0);
    expect(servicesFor(port({ kind: "trader" }), { repair: 1, refuel: 1, recharge: 1 })).toEqual([]);

    const rack = () => 400;

    expect(ammoFor(port(), STARTER_AMMO, rack)).toHaveLength(6);
    expect(ammoFor(port({ kind: "trader" }), STARTER_AMMO, rack).map(({ type }) => type)).toEqual(["rounds", "cells", "shells"]);
    expect(ammoFor(port(), STARTER_AMMO, rack)[0]).toMatchObject({ type: "rounds", aboard: STARTER_AMMO.rounds, rack: 400 });
  });

  test("what the hold could sell is priced above breaking it down, the most valuable first", () => {
    const sales = salesFor(port(), [{ id: "scrap", count: 4 }, { id: "alloy", count: 1 }, { id: "nothing", count: 3 }], ITEMS);

    expect(sales.map(({ id }) => id)).toEqual(["alloy", "scrap"]);
    expect(sales[1].price).toBeGreaterThan(ITEMS.scrap.value);
  });

  test("the hangar buys only what it can pay for and has room for, and sells from the hold, each through the ledger", () => {
    const hangar = new Hangar(newProfile());

    hangar.reward({ kind: "mission", id: "test", coin: 500 });

    const kits = hangar.count("repairKit");

    expect(hangar.buy("repairKit", 2, 60)).toBe(true);
    expect(hangar.count("repairKit")).toBe(kits + 2);
    expect(hangar.purse.RED).toBe(380);
    expect(hangar.buy("repairKit", 1, 1000)).toBe(false);
    expect(hangar.buy("nothing", 1, 1)).toBe(false);
    expect(hangar.sell("repairKit", 1, 25)).toBe(25);
    expect(hangar.sell("alloy", 1, 25)).toBe(0);
    expect(hangar.view().history.map(({ memo }) => memo)).toEqual(expect.arrayContaining(["buy:repairKit", "sell:repairKit"]));
  });
});

describe("calls for help", () => {
  const calling = () => createFlying({ distress: { ...DEFAULT_VOYAGE_CONFIG.distress, first: 0.05, seconds: 30 } });

  test("a beacon calls from ahead of the ship, out of sight", () => {
    const simulation = calling();
    const calls = heard(simulation, "distress", () => simulation.step(200));
    const { body } = partsOf(simulation);
    const call = simulation.state.distress;

    expect(calls.map(({ stage }) => stage)).toEqual(["call"]);
    expect(call).not.toBeNull();
    expect(Math.hypot((call?.x ?? 0) - body.x, (call?.y ?? 0) - body.y)).toBeGreaterThan(defaults.distress.distance[0] - 1);
    expect(simulation.snapshot.distress?.seconds).toBeGreaterThan(20);
  });

  test("survivors come aboard only while the ship holds still beside them, and pay", () => {
    const simulation = calling();

    simulation.step(200);

    const state = simulation.state as VoyageState;
    const body = atRest(simulation);

    Object.assign(state.distress ?? {}, { x: body.x, y: body.y, vx: 0, vy: 0, kind: "survivors" });

    const stages = heard(simulation, "distress", () => simulation.step(1000)).map(({ stage }) => stage);

    expect(stages).toEqual([]);
    expect(simulation.snapshot.distress?.isNear).toBe(true);
    expect(simulation.snapshot.distress?.progress).toBeGreaterThan(0.3);

    expect(heard(simulation, "distress", () => simulation.step(2000)).map(({ stage }) => stage)).toEqual(["rescued"]);
    expect(simulation.state.distress).toBeNull();
  });

  test("a spilled cargo leaves caches, and a call left too long goes quiet", () => {
    const simulation = calling();

    simulation.step(200);

    const state = simulation.state as VoyageState;
    const body = atRest(simulation);

    Object.assign(state.distress ?? {}, { x: body.x, y: body.y, vx: 0, vy: 0, kind: "cargo" });
    expect(heard(simulation, "distress", () => simulation.step(defaults.stepMs)).map(({ stage }) => stage)).toEqual(["cargo"]);
    expect(simulation.world.stores.pickup.values.filter(({ kind }) => kind === "cache").length).toBeGreaterThanOrEqual(2);

    state.nextDistressAt = state.elapsedMs;
    simulation.step(defaults.stepMs);
    Object.assign(state.distress ?? {}, { until: state.elapsedMs + 50 });
    expect(heard(simulation, "distress", () => simulation.step(200)).map(({ stage }) => stage)).toEqual(["lost"]);
  });

  test("an ambush rouses a pack of hostiles round the ship", () => {
    const simulation = createFlying();

    intoUniverse(simulation);

    const state = simulation.state as VoyageState;
    const { body } = partsOf(simulation);

    state.distress = { x: body.x, y: body.y, vx: body.vx, vy: body.vy, kind: "ambush", until: state.elapsedMs + 10000, held: 0 };

    const before = simulation.world.stores.alien.values.filter(({ threat }) => threat > 0).length;

    expect(heard(simulation, "distress", () => simulation.step(defaults.stepMs)).map(({ stage }) => stage)).toEqual(["ambush"]);
    expect(simulation.world.stores.alien.values.filter(({ threat }) => threat > 0).length).toBeGreaterThanOrEqual(before + 3);
  });
});

describe("a boss's great attacks", () => {
  test("each phase adds an attack, each is shown for long enough, and a nova's shots go evenly round", () => {
    const random = createSeededRandom(5);

    expect(BOSS_MOVES.map((moves) => moves.length)).toEqual([1, 2, 3]);
    expect(Array.from({ length: 20 }, () => bossMoveFor(0, random)).every((move) => move === "nova")).toBe(true);
    expect(new Set(Array.from({ length: 60 }, () => bossMoveFor(2, random)))).toEqual(new Set(["nova", "charge", "volley"]));
    Object.values(TELEGRAPH_MS).forEach((ms) => expect(ms).toBeGreaterThanOrEqual(900));
    expect(windup("nova", 2000, 2000 - TELEGRAPH_MS.nova)).toBe(0);
    expect(windup("nova", 2000, 2000)).toBe(1);

    const shots = novaDirections(12, 0.3);

    expect(shots).toHaveLength(12);
    shots.forEach(({ x, y }) => expect(Math.hypot(x, y)).toBeCloseTo(1, 6));
    expect(shots.reduce((sum, { x }) => sum + x, 0)).toBeCloseTo(0, 6);
  });

  test("a boss winds a nova up, holding its fire, then throws a ring of shots", () => {
    const simulation = createFlying();

    intoUniverse(simulation);

    const state = simulation.state as VoyageState;

    state.phaseMs = 1e9;
    simulation.step(defaults.stepMs * 2);

    const boss = state.boss;
    const alien = boss !== null ? simulation.world.stores.alien.get(boss) : undefined;

    expect(alien).toBeDefined();

    if (!alien || boss === null) {
      return;
    }

    alien.threat = 1;
    alien.nextMoveAt = state.elapsedMs;

    const windups = heard(simulation, "bossMove", () => simulation.step(defaults.stepMs * 2));

    expect(windups).toEqual([expect.objectContaining({ kind: "nova", isWindup: true })]);
    expect(simulation.snapshot.bossMove).toBe("nova");

    const shotsBy = () => simulation.world.stores.projectile.values.filter(({ owner }) => owner === boss).length;
    const landed = heard(simulation, "bossMove", () => simulation.step(TELEGRAPH_MS.nova + 50));

    expect(landed).toEqual([expect.objectContaining({ kind: "nova", isWindup: false })]);
    expect(shotsBy()).toBeGreaterThanOrEqual(12);
    expect(alien.move).toBeNull();
  });
});

describe("wrecks in the universes", () => {
  test("among them drift the hulks of those brought down in earlier universes of the run, saying where they came from", () => {
    const simulation = createFlying({ salvage: { ...DEFAULT_VOYAGE_CONFIG.salvage, away: { every: [0.01, 0.01], max: 6, foreign: 1 } } });

    intoUniverse(simulation);

    const state = simulation.state as VoyageState;

    state.hulks = [{ shape: "crystal", colours: ["#111111", "#222222", "#333333"], level: 4, origin: "Elsewhere" }];

    let origin: string | undefined;

    for (let attempt = 0; attempt < 40 && !origin; attempt += 1) {
      simulation.world.stores.wreck.entities.forEach((entity) => simulation.world.despawn(entity));
      state.nextWreckAt = state.elapsedMs;
      simulation.step(defaults.stepMs);
      origin = simulation.world.stores.wreck.values.find((wreck) => wreck.origin)?.origin;
    }

    expect(origin).toBe("Elsewhere");
    expect(simulation.world.stores.wreck.values.find((wreck) => wreck.origin)?.look?.shape).toBe("crystal");
  });
});

describe("docked at a port, through the host", () => {
  // A renderer that draws nothing, and a host round a calm run with a pilot's hangar, armoury and progress.
  const silentRenderer = (): VoyageRenderer => new Proxy({}, { get: (_, key) => (key === "surface" ? null : () => () => undefined) }) as unknown as VoyageRenderer;
  const hostFor = (simulation: VoyageSimulation) => {
    const armory = new Armory();
    const progress = new Progress();
    const hangar = new Hangar(newProfile(), { weapons: armory.port() });
    const scheduler = { request: () => 0, cancel: () => undefined };
    const game = new VoyageGame(simulation, silentRenderer(), null, null, DEFAULT_VOYAGE_THEME, { hangar, armory, progress, scheduler });

    hangar.reward({ kind: "mission", id: "test", coin: 2000 });

    return { game, hangar, armory };
  };

  test("the pilot docks, is mended, refuelled, rearmed and trades, each paid for, then casts off and flies on", () => {
    const simulation = createFlying();
    const { game, hangar, armory } = hostFor(simulation);

    simulation.step(defaults.stepMs);

    const station = simulation.state.stations[0];
    const { body, ship, health } = partsOf(simulation);

    Object.assign(body, { x: station.x + 0.2, y: station.y, prevX: station.x + 0.2, prevY: station.y, vx: station.vx, vy: station.vy });
    simulation.step(defaults.stepMs);
    health.hull = health.maxHull / 2;
    ship.fuel = ship.maxFuel / 4;
    armory.spendAmmo("rounds", 100);
    simulation.setAmmo(armory.stock);

    expect(game.stationView).toBeNull();
    expect(game.act({ kind: "dock" })).toBe(true);

    const view = game.stationView;
    const coin = hangar.purse.RED;

    expect(view?.services.find(({ id }) => id === "repair")?.isNeeded).toBe(true);
    expect(game.act({ kind: "service", service: "repair" })).toBe(true);
    expect(health.hull).toBe(health.maxHull);
    expect(game.act({ kind: "service", service: "refuel" })).toBe(true);
    expect(ship.fuel).toBe(ship.maxFuel);
    expect(game.act({ kind: "service", service: "refuel" })).toBe(false);

    const rounds = simulation.state.ammo.rounds;

    expect(game.act({ kind: "buyAmmo", ammo: "rounds" })).toBe(true);
    expect(simulation.state.ammo.rounds).toBe(rounds + 100);
    expect(armory.ammoOf("rounds")).toBe(rounds + 100);

    const good = game.stationView?.goods[0];

    expect(good && game.act({ kind: "buy", item: good.id, count: 1 })).toBe(true);
    expect(good && game.act({ kind: "sell", item: good.id, count: 1 })).toBe(true);
    expect(hangar.purse.RED).toBeLessThan(coin);

    expect(game.act({ kind: "undock" })).toBe(true);
    expect(game.stationView).toBeNull();
    expect(simulation.isHeld).toBe(false);
  });

  test("a perk taken through the host makes the ship stronger for the run, and a new run drops it", () => {
    const simulation = createFlying();
    const { game } = hostFor(simulation);
    const hull = simulation.config.ship.hull;

    simulation.offerPerks();
    (simulation.state as VoyageState).perkOffer = ["thickPlating", "vampire", "scavenger"];
    expect(game.act({ kind: "perk", id: "thickPlating" })).toBe(true);
    expect(simulation.config.ship.hull).toBeGreaterThan(hull);

    game.play();
    expect(simulation.config.ship.hull).toBe(hull);
    game.dispose();
  });
});

describe("fixes from review", () => {
  test("a piece's experience stays whole however small what each hit adds, so the pilot's profile always reads back", async () => {
    const armory = new Armory();
    const armor = armory.fitted("armor")?.uid ?? "";

    armory.gainExp(armor, 2.22);
    armory.gainFittedExp(6.25);
    armory.gainExp(armor, 0.4);

    expect(armory.pieces.every(({ exp }) => Number.isInteger(exp))).toBe(true);
    expect(armory.fitted("armor")?.exp).toBe(8);
    expect(isArmoryProfile(armory.toProfile())).toBe(true);

    const adapter = new MemoryAdapter();
    const repository = new PilotRepository(adapter);
    const profile = { ...newProfile(), level: 3, armory: armory.toProfile() };

    await repository.save(profile);
    expect((await repository.load()).level).toBe(3);
  });

  test("a part of the profile that no longer checks out starts again on its own, and the hangar is kept", async () => {
    const adapter = new MemoryAdapter();
    const repository = new PilotRepository(adapter);
    const kept = { ...newProfile(), level: 4 };
    const fractional = { ...kept.armory, gear: kept.armory.gear.map((piece) => ({ ...piece, exp: 6.25 })) };

    await adapter.set("pilot", { version: 4, data: { ...kept, armory: fractional, progress: { broken: true }, career: null } });

    const loaded = await repository.load();

    expect(loaded.level).toBe(4);
    expect(new Armory(loaded.armory).pieces.every(({ exp }) => exp === 6)).toBe(true);
    expect(isProgressProfile(loaded.progress)).toBe(true);
    expect(loaded.career).toEqual(newProfile().career);
  });

  test("someone brought down is not brought down again in the same step, however many bursts reach them", () => {
    const simulation = createFlying();

    intoUniverse(simulation);

    const { world } = simulation;
    const { body } = partsOf(simulation);
    const foe = world.spawn();

    world.stores.body.set(foe, { x: body.x + 1, y: body.y, vx: 0, vy: 0, prevX: body.x + 1, prevY: body.y, radius: 0.1, mass: 1 });
    world.stores.health.set(foe, { hull: 1, maxHull: 1, shields: 0, maxShields: 0, rechargeIn: 0, decals: [] });
    world.stores.alien.set(foe, { faction: 0, role: "fighter", mode: "idle", homeX: body.x + 1, homeY: body.y, threat: 0, angle: 0, level: 3, phase: 0 });

    const downed = heard(simulation, "downed", () => {
      [0, 1, 2].forEach(() => {
        const mine = world.spawn();

        world.stores.body.set(mine, { x: body.x + 1, y: body.y, vx: 0, vy: 0, prevX: body.x + 1, prevY: body.y, radius: 0.02, mass: 0.001 });
        world.stores.projectile.set(mine, {
          owner: simulation.state.ship, team: "ship", kind: "mine", damage: 50, ttl: 10, target: null, blast: 0.5, armAt: 0, trigger: 0.5,
        });
      });
      simulation.step(defaults.stepMs);
    });

    expect(downed).toHaveLength(1);
  });

  test("a port charges for shields only up to what a worn generator holds", () => {
    const simulation = createFlying();
    const { game } = (() => {
      const armory = new Armory();
      const hangar = new Hangar(newProfile(), { weapons: armory.port() });
      const scheduler = { request: () => 0, cancel: () => undefined };
      const silent = new Proxy({}, { get: (_, key) => (key === "surface" ? null : () => () => undefined) }) as unknown as VoyageRenderer;

      hangar.reward({ kind: "mission", id: "test", coin: 2000 });

      return {
        game: new VoyageGame(simulation, silent, null, null, DEFAULT_VOYAGE_THEME, { hangar, armory, progress: new Progress(), scheduler }),
      };
    })();

    simulation.step(defaults.stepMs);

    const station = simulation.state.stations[0];
    const { body, health } = partsOf(simulation);
    const modules = simulation.world.stores.modules.get(simulation.state.ship);

    Object.assign(body, { x: station.x + 0.2, y: station.y, prevX: station.x + 0.2, prevY: station.y, vx: station.vx, vy: station.vy });
    simulation.step(defaults.stepMs);

    if (modules) {
      modules.shields = 0.6;
    }

    health.shields = health.maxShields * 0.6;
    game.act({ kind: "dock" });

    expect(game.stationView?.services.find(({ id }) => id === "recharge")?.isNeeded).toBe(false);
    expect(game.act({ kind: "service", service: "recharge" })).toBe(false);
    game.dispose();
  });

  test("nothing bought at one port sells at a profit at another, however deep", () => {
    const deep = port({ depth: 12 });

    Object.values(ITEMS).forEach((spec) => {
      const cheapest = Math.ceil(spec.value * 4 * 0.85);

      expect(salePrice(deep, spec)).toBeLessThan(Math.max(2, cheapest));
    });
  });

  test("starting over erases the gear and the pilot's levels too", () => {
    const simulation = createFlying();
    const armory = new Armory();
    const progress = new Progress();
    const hangar = new Hangar(newProfile(), { weapons: armory.port() });
    const scheduler = { request: () => 0, cancel: () => undefined };
    const silent = new Proxy({}, { get: (_, key) => (key === "surface" ? null : () => () => undefined) }) as unknown as VoyageRenderer;
    const game = new VoyageGame(simulation, silent, null, null, DEFAULT_VOYAGE_THEME, { hangar, armory, progress, scheduler });

    armory.add({ base: "weapon:missile:0", rarity: "rare" });
    progress.gainExp(5000);
    (simulation.state as VoyageState).status = "over";

    expect(game.act({ kind: "reset" })).toBe(true);
    expect(armory.pieces).toHaveLength(7);
    expect(progress.level).toBe(1);
    game.dispose();
  });
});

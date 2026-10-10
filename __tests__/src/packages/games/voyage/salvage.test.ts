import {
  CatalogLootTable,
  configForLevel,
  DEFAULT_VOYAGE_CONFIG,
  Hangar,
  Loot,
  newProfile,
  NO_INPUT,
  PilotLink,
  radiusForAu,
  resolveVoyageConfig,
  REWARDS,
  SolarSystemSource,
  SystemService,
  VoyageConfig,
  VoyageSimulation,
  WreckKind,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const defaults = DEFAULT_VOYAGE_CONFIG;
const EPOCH = Date.parse("2026-10-09T12:00:00Z");

// Quiet: nothing spawns and nothing breaks down, unless a test asks.
const CALM: Partial<VoyageConfig> = {
  spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0, cometEvery: [1e6, 1e6] },
  weather: { ...defaults.weather, every: [1e6, 1e6] },
  impacts: { ...defaults.impacts, every: [1e6, 1e6] },
  traffic: [1e6, 1e6],
  life: { ...defaults.life, packs: 0, packsPerDanger: 0, bossAfter: 1e6 },
  salvage: { ...defaults.salvage, every: [1e6, 1e6] },
  faults: { ...defaults.faults, rate: 0 },
};

const create = (overrides: Partial<VoyageConfig> = {}, seed = 3) => {
  const simulation = new VoyageSimulation(new SystemService(new SolarSystemSource(), defaults.layout).getView(), {
    config: resolveVoyageConfig({ ...CALM, ...overrides }),
    random: createSeededRandom(seed),
    epochMs: EPOCH,
    loot: new CatalogLootTable(),
  });

  simulation.setView(2, 1.4);
  simulation.start();

  return simulation;
};

const partsOf = (simulation: VoyageSimulation) => {
  const { stores } = simulation.world;
  const body = stores.body.get(simulation.state.ship);
  const ship = stores.ship.get(simulation.state.ship);
  const health = stores.health.get(simulation.state.ship);

  if (!body || !ship || !health) {
    throw new Error("the ship is gone");
  }

  return { body, ship, health };
};

// Out in open space between Earth and Mars, still.
const park = (simulation: VoyageSimulation) => {
  const { star } = simulation.state.system;
  const body = partsOf(simulation).body;

  Object.assign(body, { x: star.x + 26, y: star.y + 6, prevX: star.x + 26, prevY: star.y + 6, vx: 0, vy: 0 });

  return body;
};

// A wreck beside the ship, drifting at its speed plus `drift`, holding `loot`.
const wreckBeside = (simulation: VoyageSimulation, loot: Loot, kind: WreckKind = "probe", drift = 0) => {
  const { world } = simulation;
  const ship = partsOf(simulation).body;
  const wreck = world.spawn();

  world.stores.body.set(wreck, { x: ship.x + 0.2, y: ship.y, vx: ship.vx + drift, vy: ship.vy, prevX: ship.x + 0.2, prevY: ship.y, radius: 0.07, mass: 0.3 });
  world.stores.wreck.set(wreck, { kind, loot, progress: 0, seconds: 1, isEmpty: false, seed: 0.3, faction: -1 });
  world.flush();

  return wreck;
};

const CARGO: Loot = { items: [{ id: "titanium", count: 2 }], blueprints: ["recipe:nozzle"] };

describe("voyage salvage and breakdowns", () => {
  test("coming home is a recovery: a safe landing on Earth refuels and mends the ship and says so; the Moon does not", () => {
    const touchDown = (bodyId: string) => {
      const simulation = create();
      const { state, world } = simulation;
      const place = state.system.bodies.find((body) => body.id === bodyId);
      const parts = partsOf(simulation);
      const recovered: string[] = [];

      if (!place) {
        throw new Error(`no ${bodyId}`);
      }

      simulation.events.on("recovered", ({ body }) => recovered.push(body));
      parts.ship.fuel = 10;
      parts.health.hull = parts.health.maxHull * 0.3;
      state.faults.push({ id: 7, kind: "fuelLeak", at: state.elapsedMs, severity: 0.5 });

      const contact = place.radius + parts.body.radius * 0.9;

      Object.assign(parts.body, { x: place.x + contact, y: place.y, prevX: place.x + contact, prevY: place.y, vx: place.vx, vy: place.vy });
      simulation.step(defaults.stepMs * 2);

      // The way down plays out before the landing counts; home, the crew is then picked up and the new rocket
      // stands on the pad some days later.
      for (let waited = 0; simulation.state.descent?.downAt === null && waited < 30000; waited += 250) {
        simulation.step(250);
      }

      simulation.step(defaults.descent.recoverySeconds * 1000 + 250);

      return { landedOn: world.stores.ship.get(state.ship)?.landedOn, parts: partsOf(simulation), faults: state.faults.length, recovered };
    };

    const home = touchDown("earth");

    expect(home.landedOn).toBe("earth");
    expect(home.recovered).toEqual(["earth"]);
    expect(home.parts.ship.fuel).toBe(home.parts.ship.maxFuel);
    expect(home.parts.health.hull).toBe(home.parts.health.maxHull);
    expect(home.faults).toBe(0);

    const moon = touchDown("moon");

    expect(moon.landedOn).toBe("moon");
    expect(moon.recovered).toEqual([]);
    expect(moon.parts.ship.fuel).toBeLessThan(moon.parts.ship.maxFuel);
  });

  test("a Red Coin close by is drawn in to the ship, picked up and paid into the wallet; one out of reach stays", () => {
    const simulation = create();
    const hangar = new Hangar(newProfile());
    const link = new PilotLink({ simulation, hangar, career: null, nameOf: (id) => id, notify: () => undefined, refresh: () => undefined });
    const { world } = simulation;
    const ship = park(simulation);
    const coinAt = (dx: number) => {
      const coin = world.spawn();

      world.stores.body.set(coin, { x: ship.x + dx, y: ship.y, vx: 0, vy: 0, prevX: ship.x + dx, prevY: ship.y, radius: 0.045, mass: 0.01 });
      world.stores.pickup.set(coin, { kind: "coin" });

      return coin;
    };

    link.attach();

    const near = coinAt(defaults.pickups.magnet * 0.8);
    const far = coinAt(defaults.pickups.magnet * 4);
    const before = hangar.purse.RED;

    world.flush();
    simulation.step(1500);

    expect(world.isAlive(near)).toBe(false);
    expect(world.isAlive(far)).toBe(true);
    // Paid on the next tick, gathered into one entry.
    expect(hangar.purse.RED).toBe(before);
    link.tick(simulation.snapshot);
    expect(hangar.purse.RED).toBe(before + REWARDS.coin.RED);
    expect(hangar.view().history.some((row) => row.memo === "coin:1")).toBe(true);
  });

  test("a wreck is salvaged by holding alongside it at its speed, and gives up what it held once", () => {
    const simulation = create();
    const found: Loot[] = [];

    simulation.events.on("salvaged", ({ loot }) => found.push(loot));
    park(simulation);

    const wreck = wreckBeside(simulation, CARGO);

    simulation.step(500);
    expect(simulation.snapshot.salvage).toMatchObject({ kind: "probe" });
    expect(simulation.snapshot.salvage?.progress).toBeGreaterThan(0.3);
    simulation.step(700);
    expect(found).toEqual([CARGO]);
    expect(simulation.world.stores.wreck.get(wreck)?.isEmpty).toBe(true);
    simulation.step(1500);
    expect(found).toHaveLength(1);
  });

  test("coming in slowly, the tractor beam matches speeds; a wreck flashing past, or a ship burning hard, cannot be salvaged", () => {
    const outcome = (drift: number, thrust: number) => {
      const simulation = create();
      const found: Loot[] = [];

      simulation.events.on("salvaged", ({ loot }) => found.push(loot));
      park(simulation);
      wreckBeside(simulation, CARGO, "rocket", drift);

      for (let index = 0; index < 150; index += 1) {
        simulation.step(defaults.stepMs * 2, { ...NO_INPUT, thrust });
      }

      return found.length;
    };

    expect(outcome(0.4, 0)).toBe(1);
    expect(outcome(1.2, 0)).toBe(0);
    expect(outcome(0, 1)).toBe(0);
  });

  test("derelicts drift into view by themselves, and every one holds something from the catalogue or nothing", () => {
    const simulation = create({ salvage: { ...defaults.salvage, every: [1, 1] } });

    park(simulation);
    simulation.step(4000);

    const wrecks = simulation.world.stores.wreck.values;

    expect(wrecks.length).toBeGreaterThan(0);
    expect(wrecks.length).toBeLessThanOrEqual(defaults.salvage.max);
    wrecks.forEach((wreck) => expect(["probe", "rocket", "starship"]).toContain(wreck.kind));
  });

  test("things break down more as they wear, never more than a few at once, and a fault fixed is gone", () => {
    const simulation = create({ faults: { ...defaults.faults, rate: 1 } });
    const broke: string[] = [];
    const fixed: string[] = [];

    simulation.events.on("fault", ({ kind }) => broke.push(kind));
    simulation.events.on("fixed", ({ kind }) => fixed.push(kind));
    park(simulation);
    simulation.step(3000);
    expect(simulation.state.faults).toHaveLength(defaults.faults.max);
    expect(new Set(broke).size).toBe(broke.length);

    const [first] = simulation.state.faults;

    simulation.apply([{ kind: "fix", fault: first.id }]);
    expect(simulation.state.faults.map((fault) => fault.id)).not.toContain(first.id);
    expect(fixed).toEqual([first.kind]);
  });

  test("a fuel leak drains the tank, a breach bleeds the hull, and a misfire cuts the engines out now and then", () => {
    const leaking = create();

    park(leaking);
    leaking.state.faults.push({ id: 1, kind: "fuelLeak", at: 0, severity: 1 }, { id: 2, kind: "breach", at: 0, severity: 1 });

    const fuel = partsOf(leaking).ship.fuel;
    const hull = partsOf(leaking).health.hull;

    leaking.step(2000);
    expect(partsOf(leaking).ship.fuel).toBeLessThan(fuel - defaults.faults.leak);
    expect(partsOf(leaking).health.hull).toBeLessThan(hull - defaults.faults.breach);

    const misfiring = create();
    const thrust: number[] = [];

    park(misfiring);
    misfiring.state.faults.push({ id: 1, kind: "misfire", at: 0, severity: 1 });

    for (let index = 0; index < 300; index += 1) {
      misfiring.step(defaults.stepMs, { ...NO_INPUT, thrust: 1 });
      thrust.push(partsOf(misfiring).ship.thrust);
    }

    expect(thrust.filter((value) => value === 0).length).toBeGreaterThan(20);
    expect(thrust.filter((value) => value === 1).length).toBeGreaterThan(100);
  });

  test("a consumable used and a refit both act on the run: a refit keeps every bar at its share and swaps the guns", () => {
    const simulation = create();

    park(simulation);
    partsOf(simulation).health.hull = defaults.ship.hull / 2;
    partsOf(simulation).ship.fuel = 10;
    simulation.apply([{ kind: "fuel", share: 0.45 }]);
    expect(partsOf(simulation).ship.fuel).toBeCloseTo(10 + defaults.ship.fuel * 0.45);

    const corvette = configForLevel(simulation.config, 10);

    simulation.refit(corvette, 10);
    expect(partsOf(simulation).health.maxHull).toBe(corvette.ship.hull);
    expect(partsOf(simulation).health.hull / partsOf(simulation).health.maxHull).toBeCloseTo(0.5);
    expect(partsOf(simulation).body.radius).toBe(corvette.ship.radius);
    expect(simulation.world.stores.weapon.get(simulation.state.ship)?.kind).toBe("laser");
    expect(simulation.snapshot.level).toBe(10);
  });

  test("what the hold has no room for is put back on the wreck, and ore is scooped up only once nothing is left on it", () => {
    const simulation = create();

    park(simulation);

    const wreck = wreckBeside(simulation, { items: [{ id: "titanium", count: 3 }], blueprints: [] }, "ore");

    simulation.events.on("salvaged", ({ wreck: entity }) => simulation.returnLoot(entity, { items: [{ id: "titanium", count: 1 }], blueprints: [] }));
    simulation.step(1500);

    expect(simulation.world.isAlive(wreck)).toBe(true);
    expect(simulation.world.stores.wreck.get(wreck)).toMatchObject({ isEmpty: false, loot: { items: [{ id: "titanium", count: 1 }] } });
  });

  test("a consumable is only worth using when it would do the ship good", () => {
    const simulation = create();

    park(simulation);
    expect(simulation.wouldHelp([{ kind: "fuel", share: 0.45 }])).toBe(false);
    partsOf(simulation).ship.fuel = 5;
    expect(simulation.wouldHelp([{ kind: "fuel", share: 0.45 }])).toBe(true);
    expect(simulation.wouldHelp([{ kind: "fix", fault: 99 }])).toBe(false);
    Object.assign(simulation.world.stores.modules.get(simulation.state.ship) ?? {}, { sensors: 0.99 });
    expect(simulation.wouldHelp([{ kind: "hull", share: 0.3 }, { kind: "module", module: "worst", amount: 0.35 }])).toBe(false);
  });

  test("landed on any world, the crew patches up the oldest fault for nothing, one at a time", () => {
    const simulation = create();
    const fixed: string[] = [];

    simulation.events.on("fixed", ({ kind }) => fixed.push(kind));

    const moon = simulation.state.system.bodies.find((body) => body.id === "moon");

    if (!moon) {
      throw new Error("no Moon");
    }

    Object.assign(partsOf(simulation).ship, { landedOn: "moon", landedOffset: { x: 0, y: -moon.radius - defaults.ship.radius } });
    simulation.state.faults.push({ id: 1, kind: "fuelLeak", at: 0, severity: 1 }, { id: 2, kind: "glitch", at: 0, severity: 1 });
    simulation.step((defaults.faults.groundFixSeconds + 0.5) * 1000);
    expect(fixed).toEqual(["fuelLeak"]);
    simulation.step(defaults.faults.groundFixSeconds * 1000);
    expect(fixed).toEqual(["fuelLeak", "glitch"]);
  });

  test("past Saturn the compass leads outward to the black hole, never back to worlds left behind, and telemetry says how far it is", () => {
    const simulation = create();
    const { star, scale } = simulation.state.system;
    const body = partsOf(simulation).body;
    const at = (au: number) => {
      const x = star.x + radiusForAu(scale, au);

      Object.assign(body, { x, y: star.y, prevX: x, prevY: star.y, vx: 0, vy: 0 });
      simulation.step(defaults.stepMs);
    };

    at(20);

    const waypoint = simulation.state.waypoint?.id ?? "";

    expect(["sun", "mercury", "venus", "mars", "jupiter", "saturn"]).not.toContain(waypoint);
    expect(simulation.snapshot.telemetry.toHoleAu).toBeCloseTo(52 - 20, 0);

    ["uranus", "neptune", "pluto", "kuiper"].forEach((id) => simulation.state.passed.add(id));
    at(40);
    expect(simulation.state.waypoint?.id).toBe("edge");
  });
});

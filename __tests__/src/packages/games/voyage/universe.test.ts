import {
  arrivalSpeed,
  bindingEnergy,
  craterKm,
  DEFAULT_UNIVERSE_NAMES,
  DEFAULT_VOYAGE_CONFIG,
  impactEnergy,
  impactOutcome,
  leadDirection,
  NO_INPUT,
  PhenomenonSpec,
  resolveVoyageConfig,
  SolarSystemSource,
  SystemService,
  UniverseGenerator,
  VoyageConfig,
  VoyageSimulation,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const defaults = DEFAULT_VOYAGE_CONFIG;
const EPOCH = Date.parse("2026-10-09T12:00:00Z");
const generator = new UniverseGenerator(defaults.layout, DEFAULT_UNIVERSE_NAMES);
const ZONE = { name: "The Matrix", style: "matrix" as const, accent: "#4bffa5", deep: "#020a06", hazard: "#ff4d5e" };

// Quiet: nothing spawns, no flares, no rocks headed for worlds, no traffic, unless a test asks.
const CALM: Partial<VoyageConfig> = {
  spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0, cometEvery: [1e6, 1e6] },
  weather: { ...defaults.weather, every: [1e6, 1e6] },
  impacts: { ...defaults.impacts, every: [1e6, 1e6] },
  traffic: [1e6, 1e6],
  life: { ...defaults.life, packs: 0, packsPerDanger: 0, bossAfter: 1e6 },
};

const create = (overrides: Partial<VoyageConfig> = {}, seed = 3) => {
  const simulation = new VoyageSimulation(new SystemService(new SolarSystemSource(), defaults.layout).getView(), {
    config: resolveVoyageConfig({ ...CALM, ...overrides }),
    random: createSeededRandom(seed),
    epochMs: EPOCH,
  });

  simulation.setView(2, 1.4);
  simulation.start();

  return simulation;
};

const partsOf = (simulation: VoyageSimulation) => {
  const { stores } = simulation.world;
  const body = stores.body.get(simulation.state.ship);
  const health = stores.health.get(simulation.state.ship);
  const modules = stores.modules.get(simulation.state.ship);

  if (!body || !health || !modules) {
    throw new Error("the ship is gone");
  }

  return { body, health, modules };
};

const place = (simulation: VoyageSimulation, x: number, y: number, vx = 0, vy = 0) => {
  Object.assign(partsOf(simulation).body, { x, y, prevX: x, prevY: y, vx, vy });
};

// Through the singularity into the first universe, then replace what it holds with what a test needs.
const intoUniverse = (simulation: VoyageSimulation) => {
  const { star, edge } = simulation.state.system;

  place(simulation, star.x + edge + 0.5, star.y, 1, 0);
  simulation.step(defaults.stepMs);

  const { stores } = simulation.world;
  const hole = stores.hole.entities.find((entity) => stores.hole.get(entity)?.isSingularity);
  const at = hole !== undefined ? stores.body.get(hole) : undefined;

  if (at) {
    place(simulation, at.x, at.y);
  }

  simulation.step(defaults.holes.captureMs + defaults.holes.lostMs + 200);
  expect(simulation.state.phase).toBe("universe");
};

const withPhenomenon = (simulation: VoyageSimulation, phenomenon: Partial<PhenomenonSpec>) => {
  const cosmos = simulation.state.cosmos;

  if (!cosmos) {
    throw new Error("not in a universe");
  }

  cosmos.phenomena = [{ kind: "nebula", x: 0, y: 0, toX: 0, toY: 0, radius: 1, strength: 1, seed: 1, ...phenomenon }];
  cosmos.factions = [];
};

describe("universes", () => {
  test("the same seed makes the same universe; different seeds make different ones", () => {
    const first = generator.generate(6, 1234, null);
    const again = generator.generate(6, 1234, null);
    const names = new Set(Array.from({ length: 12 }, (_, index) => generator.generate(6, 1000 + index * 97, null).name));

    expect(again.name).toBe(first.name);
    expect(again.system.bodies.map((body) => body.radius)).toEqual(first.system.bodies.map((body) => body.radius));
    expect(names.size).toBeGreaterThan(9);
  });

  test("the first universes take the site's zones for their look and name", () => {
    const spec = generator.generate(0, 77, ZONE);

    expect(spec).toMatchObject({ name: "The Matrix", style: "matrix", accent: "#4bffa5" });
  });

  test("a world's kind follows the light that reaches it: hot near a bright star, cold far out", () => {
    const specs = Array.from({ length: 40 }, (_, index) => generator.generate(5, 500 + index, null)).filter((spec) => spec.starKind && spec.starKind !== "neutron");
    const inner = specs.map((spec) => spec.looks[spec.system.bodies[0].id].surface.kind);
    const hot = ["lava", "volcanic", "desert", "toxic", "haze", "terran"];

    expect(inner.filter((kind) => hot.includes(kind)).length).toBeGreaterThan(inner.length * 0.4);
    specs.forEach((spec) => spec.system.bodies.filter((body) => body.isGiant).forEach((body) => expect(body.air?.kind).toBe("giant")));
  });

  test("a void has no star, only dark rogue worlds; a dark forest hides everyone who lives there", () => {
    const specs = Array.from({ length: 200 }, (_, index) => generator.generate(8, 9000 + index, null));
    const voids = specs.filter((spec) => spec.style === "void");
    const forests = specs.filter((spec) => spec.phenomena.some((phenomenon) => phenomenon.kind === "darkForest"));

    expect(voids.length).toBeGreaterThan(0);
    voids.forEach((spec) => {
      expect(spec.system.star.luminosity).toBe(0);
      spec.system.bodies.forEach((body) => expect(spec.looks[body.id].surface.kind).toBe("rogue"));
    });
    expect(forests.length).toBeGreaterThan(0);
    forests.forEach((spec) => expect(spec.factions).toEqual([]));
  });

  test("each universe the ship reaches is new: its own name, star system and worlds", () => {
    const simulation = create();

    intoUniverse(simulation);

    const first = simulation.state.cosmos;

    expect(simulation.snapshot.universeName).toBe(first?.name);
    expect(simulation.state.system).toBe(first?.system);
    expect(simulation.state.system.bodies.every((body) => body.id.startsWith("u0-"))).toBe(true);
  });
});

describe("combat", () => {
  test("a shot led at a moving target meets it", () => {
    const from = { x: 0, y: 0, vx: 0, vy: 0, prevX: 0, prevY: 0, radius: 0.1, mass: 1 };
    const to = { x: 5, y: 0, vx: 0, vy: 1, prevX: 5, prevY: 0, radius: 0.1, mass: 1 };
    const aim = leadDirection(from, to, 4);

    expect(aim).not.toBeNull();

    if (aim) {
      expect(aim.x * 4 * aim.time).toBeCloseTo(5, 6);
      expect(aim.y * 4 * aim.time).toBeCloseTo(aim.time, 6);
    }

    expect(leadDirection(from, { ...to, vx: 10 }, 4)).toBeNull();
  });

  test("hostiles notice the ship within their aggro radius, fire, and their whole pack joins", () => {
    const simulation = create();

    intoUniverse(simulation);

    const cosmos = simulation.state.cosmos;

    if (!cosmos) {
      throw new Error("no universe");
    }

    cosmos.phenomena = [];
    cosmos.factions = [{ id: 0, name: "Testing Swarm", disposition: "hostile", shape: "swarm", colours: ["#111111", "#222222", "#333333"], weapon: "cannon", level: 3,
      pack: 3, speed: 1.5, aggroRadius: 5, leashRadius: 18, hull: 120, shields: 0 }];

    const ship = partsOf(simulation).body;
    const shots: string[] = [];

    simulation.events.on("fired", ({ team }) => shots.push(team));

    for (let member = 0; member < 3; member += 1) {
      const alien = simulation.world.spawn();

      simulation.world.stores.body.set(alien, { x: ship.x + 3 + member * 0.3, y: ship.y, vx: 0, vy: 0, prevX: ship.x + 3, prevY: ship.y, radius: 0.07, mass: 1 });
      simulation.world.stores.health.set(alien, { hull: 120, maxHull: 120, shields: 0, maxShields: 0, rechargeIn: 0, decals: [] });
      simulation.world.stores.alien.set(alien, { faction: 0, role: "fighter", mode: "idle", homeX: ship.x + 3, homeY: ship.y, threat: 0, angle: 0, level: 3, phase: 0 });
      simulation.world.stores.weapon.set(alien, { kind: "cannon", damage: 10, rate: 2, range: 6, speed: 6, heat: 0, cooldown: 0 });
    }

    simulation.step(1500);

    expect(simulation.world.stores.alien.values.every((alien) => alien.threat > 0)).toBe(true);
    expect(shots).toContain("aliens");
    expect(shots).toContain("ship");
  });

  test("the guns never fire on the peaceful by themselves, but do once locked on", () => {
    const simulation = create();

    intoUniverse(simulation);

    const cosmos = simulation.state.cosmos;

    if (!cosmos) {
      throw new Error("no universe");
    }

    cosmos.phenomena = [];
    cosmos.factions = [{ id: 0, name: "Testing Choir", disposition: "peaceful", shape: "saucer", colours: ["#111111", "#222222", "#333333"], weapon: "cannon", level: 1,
      pack: 1, speed: 1, aggroRadius: 5, leashRadius: 18, hull: 200, shields: 0 }];

    const ship = partsOf(simulation).body;
    const trader = simulation.world.spawn();
    const shots: string[] = [];

    simulation.events.on("fired", ({ team }) => shots.push(team));
    simulation.world.stores.body.set(trader, { x: ship.x + 2, y: ship.y, vx: 0, vy: 0, prevX: ship.x + 2, prevY: ship.y, radius: 0.18, mass: 1 });
    simulation.world.stores.health.set(trader, { hull: 200, maxHull: 200, shields: 0, maxShields: 0, rechargeIn: 0, decals: [] });
    simulation.world.stores.alien.set(trader, { faction: 0, role: "trader", mode: "idle", homeX: ship.x + 2, homeY: ship.y, threat: 0, angle: 0, level: 1, phase: 0 });
    simulation.step(1000);
    expect(shots).toEqual([]);

    simulation.lock(trader);
    simulation.step(1000);
    expect(shots).toContain("ship");
    expect(simulation.world.stores.alien.get(trader)?.mode ?? "flee").toBe("flee");
  });

  test("chased too far from home, they leash: give up, go home and heal to full", () => {
    const simulation = create();

    intoUniverse(simulation);

    const cosmos = simulation.state.cosmos;

    if (!cosmos) {
      throw new Error("no universe");
    }

    cosmos.phenomena = [];
    cosmos.factions = [{ id: 0, name: "Testing Wardens", disposition: "territorial", shape: "monolith", colours: ["#111111", "#222222", "#333333"], weapon: "laser",
      level: 2, pack: 1, speed: 2, aggroRadius: 4, leashRadius: 6, hull: 300, shields: 0 }];

    const ship = partsOf(simulation).body;
    const warden = simulation.world.spawn();

    // Home is far from the ship, so once there it has no reason to come back for it.
    simulation.setAutoFire(false);
    simulation.world.stores.body.set(warden, { x: ship.x + 9, y: ship.y, vx: 0, vy: 0, prevX: ship.x + 9, prevY: ship.y, radius: 0.15, mass: 1 });
    simulation.world.stores.health.set(warden, { hull: 150, maxHull: 300, shields: 0, maxShields: 0, rechargeIn: 0, decals: [] });
    simulation.world.stores.alien.set(warden, {
      faction: 0, role: "fighter", mode: "chase", homeX: ship.x + 30, homeY: ship.y, threat: 50, angle: 0, level: 2, phase: 0,
    });
    simulation.step(defaults.stepMs);
    expect(simulation.world.stores.alien.get(warden)?.mode).toBe("evade");

    simulation.step(12000);
    expect(simulation.world.stores.alien.get(warden)?.mode).toBe("idle");
    expect(simulation.world.stores.health.get(warden)?.hull).toBe(300);
  });
});

describe("rocks headed for worlds", () => {
  test("what holds Earth together, and the crater of a dinosaur killer, match the textbooks", () => {
    expect(bindingEnergy(9.81, 6371)).toBeCloseTo(2.24e32, -31);
    // Chicxulub: about 10 km across at about 20 km/s left a crater of 150 to 200 km.
    expect(craterKm(10, 20, 9.81)).toBeGreaterThan(80);
    expect(craterKm(10, 20, 9.81)).toBeLessThan(200);
    expect(impactEnergy(10, 20) / bindingEnergy(9.81, 6371)).toBeLessThan(1e-7);
  });

  test("energy against binding decides: a crater, a burst in thick air, a melted face, or a broken world", () => {
    expect(impactOutcome(1e-9, 5, true)).toBe("crater");
    expect(impactOutcome(1e-9, 0.05, true)).toBe("airburst");
    expect(impactOutcome(1e-9, 0.05, false)).toBe("crater");
    expect(impactOutcome(0.05, 900, true)).toBe("catastrophe");
    expect(impactOutcome(1.4, 3000, false)).toBe("shattered");
  });

  test("a rock falls through a world's own escape speed on the way in", () => {
    const earth = new SystemService(new SolarSystemSource(), defaults.layout).getView().bodies.find((body) => body.id === "earth");

    expect(earth && arrivalSpeed(0, earth)).toBeCloseTo(11.2, 0);
  });

  test("one sets out for a world with a warning, and if nothing stops it, it leaves a crater", () => {
    const simulation = create({ impacts: { ...defaults.impacts, every: [0.3, 0.3], speed: [1.6, 1.6], solarKm: [5, 5] } });
    const alerts: string[] = [];
    const impacts: string[] = [];

    simulation.events.on("impactAlert", ({ target }) => alerts.push(target));
    simulation.events.on("impact", ({ target, outcome }) => impacts.push(`${target}:${outcome}`));
    simulation.setAutoFire(false);
    simulation.step(450);
    expect(alerts.length).toBe(1);

    simulation.step(12000);
    expect(impacts.some((impact) => impact.startsWith(alerts[0]))).toBe(true);
    expect(simulation.state.craters[alerts[0]]?.length ?? (impacts[0].endsWith("airburst") ? 1 : 0)).toBeGreaterThan(0);
  });

  test("shot enough, a rock breaks apart; shot once, a small one is pushed off course", () => {
    const simulation = create({ impacts: { ...defaults.impacts, every: [0.2, 0.2], speed: [0.5, 0.5], solarKm: [1, 1] } });
    const broken: string[] = [];
    const deflected: string[] = [];

    simulation.events.on("impactorBroken", ({ target }) => broken.push(target));
    simulation.events.on("deflected", ({ target }) => deflected.push(target));
    simulation.step(400);

    const rock = simulation.world.stores.impactor.entities[0];
    const at = simulation.world.stores.body.get(rock);

    if (at) {
      place(simulation, at.x + 2, at.y + 2);
    }

    simulation.lock(rock);
    simulation.step(6000);
    expect(broken.length + deflected.length).toBeGreaterThan(0);
  });
});

describe("strange things", () => {
  test("a pulsar's beam drains the shields of a ship it crosses", () => {
    const simulation = create();

    intoUniverse(simulation);

    const ship = partsOf(simulation);

    withPhenomenon(simulation, { kind: "pulsar", x: ship.body.x - 10, y: ship.body.y });
    simulation.state.phenomena.pulsarAngle = 0;

    const before = ship.health.shields;

    simulation.step(100);
    expect(ship.health.shields).toBeLessThan(before);
  });

  test("in a dark forest, a ship that is too loud is heard, and something strikes from far off", () => {
    const simulation = create();
    const heard: number[] = [];
    const strikes: string[] = [];

    intoUniverse(simulation);
    withPhenomenon(simulation, { kind: "darkForest" });
    simulation.events.on("heard", ({ seconds }) => heard.push(seconds));
    simulation.events.on("fired", ({ kind }) => strikes.push(kind));
    // Engines at full burn are loud; long enough, and they are heard.
    simulation.setAutoFire(false);
    simulation.step(9000, { ...NO_INPUT, thrust: 1 });
    simulation.step(1800, NO_INPUT);

    expect(heard.length).toBe(1);
    expect(strikes).toContain("photoid");
  });

  test("a wormhole throws the ship to its other mouth", () => {
    const simulation = create();

    intoUniverse(simulation);

    const { x, y } = partsOf(simulation).body;

    withPhenomenon(simulation, { kind: "wormholes", x, y, toX: x + 30, toY: y - 20 });
    simulation.step(defaults.stepMs * 2);

    expect(Math.hypot(partsOf(simulation).body.x - (x + 30), partsOf(simulation).body.y - (y - 20))).toBeLessThan(2);
  });

  test("a supernova warns, blows, and its shock hurts a ship in the open", () => {
    const simulation = create();
    const novas: boolean[] = [];

    intoUniverse(simulation);

    const ship = partsOf(simulation);

    withPhenomenon(simulation, { kind: "supernova", x: ship.body.x + 6, y: ship.body.y + 40 });
    simulation.state.system.bodies.forEach((body) => Object.assign(body, { x: 1e4, y: 1e4 }));
    simulation.state.phenomena.supernova = { blowsAt: simulation.state.elapsedMs + 500, shock: 0, hasHit: false, isWarned: false };
    simulation.events.on("supernova", ({ isBlown }) => novas.push(isBlown));
    ship.health.shields = 0;

    const hull = ship.health.hull;

    // The shock spreads at 3 world units a second; the star is about 40 away.
    simulation.step(500 + (Math.hypot(6, 40) / 3) * 1000 + 500);
    expect(novas).toEqual([false, true]);
    expect(ship.health.hull).toBeLessThan(hull);
  });

  test("a supernova's shock strikes even a ship flying fast into it, which once slipped between two steps", () => {
    const simulation = create();

    intoUniverse(simulation);

    const ship = partsOf(simulation);

    withPhenomenon(simulation, { kind: "supernova", x: ship.body.x, y: ship.body.y + 30 });
    simulation.state.system.bodies.forEach((body) => Object.assign(body, { x: 1e4, y: 1e4 }));
    simulation.state.phenomena.supernova = { blowsAt: simulation.state.elapsedMs, shock: 0, hasHit: false, isWarned: true };

    const { x } = ship.body;

    for (let elapsed = 0; elapsed < 9000 && !simulation.state.phenomena.supernova?.hasHit; elapsed += defaults.stepMs) {
      // Diving straight at the star, as fast as the ship goes.
      Object.assign(ship.body, { x, prevX: x, vx: 0, vy: 3 });
      simulation.step(defaults.stepMs);
    }

    expect(simulation.state.phenomena.supernova?.hasHit).toBe(true);
  });
});

describe("void universes", () => {
  test("hold only solid dark worlds, never giants with no air to enter", () => {
    const VOID = { ...ZONE, style: "void" as const };
    const worlds = Array.from({ length: 30 }, (_, index) => generator.generate(6 + index, 500 + index * 31, VOID).system.bodies).flat();

    expect(worlds.length).toBeGreaterThan(20);
    expect(worlds.every((world) => !world.isGiant && world.isLandable)).toBe(true);
  });
});

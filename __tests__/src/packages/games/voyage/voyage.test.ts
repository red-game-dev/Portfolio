import { InMemoryContentSource } from "@/packages/core/content";
import {
  DEFAULT_VOYAGE_CONFIG,
  NO_INPUT,
  resolveVoyageConfig,
  RouteService,
  SOLAR_SYSTEM,
  SolarSystemSource,
  VoyageConfig,
  VoyageInput,
  VoyageSimulation,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const defaults = DEFAULT_VOYAGE_CONFIG;
const route = new RouteService(new SolarSystemSource(), defaults.layout).getView();
const bodyOf = (id: string) => {
  const found = route.bodies.find((body) => body.id === id);

  if (!found) {
    throw new Error(`no ${id} on the route`);
  }

  return found;
};

// Nothing spawns round the ship, so a test sees only what it sets up.
const CALM: Partial<VoyageConfig> = { spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0 } };

const create = (overrides: Partial<VoyageConfig> = {}, seed = 7) => {
  const simulation = new VoyageSimulation(route, { config: resolveVoyageConfig({ ...CALM, ...overrides }), random: createSeededRandom(seed) });

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

const place = (simulation: VoyageSimulation, x: number, y: number, vx = 0, vy = 0) => {
  Object.assign(partsOf(simulation).body, { x, y, prevX: x, prevY: y, vx, vy });
};

const burn = (thrust: number, aim: { x: number; y: number } | null = null): VoyageInput => ({ ...NO_INPUT, thrust, aim });

describe("the solar system route", () => {
  test("is laid out outward in the order of real distance from the Sun, winding to either side", () => {
    const distances = route.bodies.map((body) => Math.hypot(body.x, body.y));

    expect(distances).toEqual([...distances].sort((first, second) => first - second));
    expect(route.bodies.map((body) => body.id)).toEqual(SOLAR_SYSTEM.bodies.map((body) => body.id));
    expect(new Set(route.bodies.slice(2).map((body) => Math.sign(body.x))).size).toBe(2);
    expect(Math.hypot(route.singularity.x, route.singularity.y)).toBeGreaterThan(route.length);
  });

  test("refuses data whose rules the layout depends on", () => {
    const backwards = { ...SOLAR_SYSTEM, bodies: [...SOLAR_SYSTEM.bodies].reverse() };

    expect(() => new RouteService(new InMemoryContentSource(backwards), defaults.layout).getView()).toThrow();
    expect(() => new RouteService(new InMemoryContentSource({ bodies: "none" }), defaults.layout).getView()).toThrow();
  });

  test.each([["earth", 9.81], ["mars", 3.72], ["jupiter", 24.79], ["pluto", 0.62]])("%s's surface gravity reads true in telemetry", (id, gravity) => {
    const simulation = create();
    const body = bodyOf(String(id));

    place(simulation, body.x + body.radius * 1.001, body.y);
    simulation.step(defaults.stepMs);

    expect(simulation.snapshot.telemetry.gravity).toBeCloseTo(Number(gravity), 0);
    expect(simulation.snapshot.telemetry.dominant).toBe(id);
  });
});

describe("flight", () => {
  test("a burn pushes along the nose and costs fuel; an empty tank pushes nothing", () => {
    const simulation = create();

    place(simulation, 5, 5);
    partsOf(simulation).ship.angle = 0;
    simulation.step(1000, burn(1));
    expect(partsOf(simulation).body.vx).toBeGreaterThan(1);
    expect(partsOf(simulation).ship.fuel).toBeLessThan(defaults.ship.fuel);

    partsOf(simulation).ship.fuel = 0;
    place(simulation, 5, 5);
    simulation.step(500, burn(1));
    expect(Math.abs(partsOf(simulation).body.vx)).toBeLessThan(0.01);
  });

  test("the ship turns towards the aim at its turn rate, and the brake slows it", () => {
    const simulation = create();

    place(simulation, 5, 5, 2, 0);
    partsOf(simulation).ship.angle = 0;
    simulation.step(100, { ...NO_INPUT, aim: { x: 5, y: 10 } });
    expect(partsOf(simulation).ship.angle).toBeCloseTo(defaults.ship.turnRate * 0.1, 1);

    simulation.step(1000, { ...NO_INPUT, brake: true });
    expect(Math.hypot(partsOf(simulation).body.vx, partsOf(simulation).body.vy)).toBeLessThan(1);
  });

  test("left alone near Jupiter, the ship falls towards it", () => {
    const simulation = create();
    const jupiter = bodyOf("jupiter");

    place(simulation, jupiter.x + jupiter.radius * 3, jupiter.y);
    simulation.step(1500);

    expect(partsOf(simulation).body.x).toBeLessThan(jupiter.x + jupiter.radius * 3);
  });
});

describe("surfaces and air", () => {
  test("touching Mars slowly is a landing and scores once; a burn lifts off", () => {
    const simulation = create();
    const mars = bodyOf("mars");
    const scoreBefore = simulation.state.score;

    place(simulation, mars.x, mars.y - mars.radius - defaults.ship.radius - 0.001, 0, 0.1);
    simulation.step(200);

    expect(partsOf(simulation).ship.landedOn).toBe("mars");
    expect(simulation.state.score - scoreBefore).toBeGreaterThanOrEqual(defaults.scoring.landing);

    partsOf(simulation).ship.angle = -Math.PI / 2;
    simulation.step(300, burn(1));
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("hitting a rocky surface fast is a crash: damage, and a bounce", () => {
    const simulation = create();
    const moon = bodyOf("moon");

    place(simulation, moon.x, moon.y - moon.radius - defaults.ship.radius - 0.01, 0, 2.5);
    simulation.step(100);

    const { body, health } = partsOf(simulation);

    expect(health.shields + health.hull).toBeLessThan(defaults.ship.shields + defaults.ship.hull);
    expect(body.vy).toBeLessThan(0);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("Earth's air drags and heats a fast ship; Jupiter's upper air refills the tank", () => {
    const simulation = create();
    const earth = bodyOf("earth");
    const jupiter = bodyOf("jupiter");

    place(simulation, earth.x, earth.y - earth.radius - 0.02, 3, 0);
    simulation.step(200);
    expect(Math.hypot(partsOf(simulation).body.vx, partsOf(simulation).body.vy)).toBeLessThan(3);
    expect(partsOf(simulation).ship.heat).toBeGreaterThan(0);

    partsOf(simulation).ship.fuel = 10;
    place(simulation, jupiter.x - jupiter.radius - 0.05, jupiter.y);
    simulation.step(100);
    expect(partsOf(simulation).ship.fuel).toBeGreaterThan(10);
  });

  test("too deep in a giant the warm up throws the ship clear; outside the warm up the pressure crushes the hull", () => {
    const safe = create();
    const strict = create({ isSolarSafe: false });
    const jupiter = bodyOf("jupiter");
    const emergencies: string[] = [];

    safe.events.on("emergency", ({ body }) => emergencies.push(body));
    place(safe, jupiter.x - jupiter.radius * 0.8, jupiter.y);
    safe.step(defaults.stepMs * 2);
    expect(emergencies).toEqual(["jupiter"]);
    expect(Math.hypot(partsOf(safe).body.x - jupiter.x, partsOf(safe).body.y - jupiter.y)).toBeGreaterThan(jupiter.radius);

    place(strict, jupiter.x - jupiter.radius * 0.9, jupiter.y);
    strict.step(400);
    expect(partsOf(strict).health.hull).toBeLessThan(defaults.ship.hull);
  });
});

describe("damage", () => {
  test("shields take hits first, the hull is marked where it was hit, and shields come back after a pause", () => {
    const simulation = create({ isSolarSafe: false });
    const { body, ship, health } = partsOf(simulation);
    const hits: number[] = [];

    simulation.events.on("hit", ({ toHull }) => hits.push(toHull));
    place(simulation, 20, 20);
    ship.angle = 0;
    health.shields = 50;

    const rock = simulation.world.spawn();

    simulation.world.stores.body.set(rock, { x: body.x + 0.1, y: body.y, vx: -3, vy: 0, prevX: body.x + 0.1, prevY: body.y, radius: 0.1, mass: 1 });
    simulation.world.stores.hazard.set(rock, { shape: 0, isIcy: false });
    simulation.step(defaults.stepMs);

    expect(health.shields).toBe(0);
    expect(hits[0]).toBeGreaterThan(0);
    expect(health.decals).toHaveLength(1);
    expect(Math.abs(health.decals[0].angle)).toBeLessThan(0.5);

    simulation.step(defaults.ship.shieldDelayMs + 1000);
    expect(health.shields).toBeGreaterThan(0);
  });

  test("in the warm up the hull holds; past it, the ship is destroyed once when the hull is gone", () => {
    const warm = create();
    const strict = create({ isSolarSafe: false });
    const destroyed: number[] = [];

    partsOf(warm).ship.heat = 40;
    warm.step(3000);
    expect(warm.state.status).toBe("flying");
    expect(partsOf(warm).health.hull).toBeGreaterThan(0);

    strict.events.on("destroyed", () => destroyed.push(1));
    partsOf(strict).health.shields = 0;
    partsOf(strict).ship.heat = 40;
    strict.step(4000);
    expect(strict.state.status).toBe("over");
    expect(destroyed).toEqual([1]);
  });
});

describe("the way out and beyond", () => {
  test("passes every stop in order, then the singularity wakes, takes the ship, and it wakes in the first universe", () => {
    const simulation = create();
    const passed: string[] = [];
    const phases: string[] = [];

    simulation.events.on("passing", ({ stop }) => passed.push(stop));
    simulation.events.on("phase", ({ phase }) => phases.push(phase));

    route.bodies.slice(1).forEach((body) => {
      place(simulation, body.x + body.radius * 4, body.y);
      simulation.step(defaults.stepMs);
    });

    expect(passed.filter((id) => route.bodies.some((body) => body.id === id))).toEqual(route.bodies.slice(1).map((body) => body.id));
    expect(passed).toEqual(expect.arrayContaining(route.belts.map((belt) => belt.id)));
    expect(simulation.state.phase).toBe("singularity");

    const { x, y } = route.singularity;

    place(simulation, x, y + defaults.holes.singularityHorizon * 0.9);
    simulation.step(defaults.holes.captureMs + 100);
    expect(simulation.state.phase).toBe("lost");

    simulation.step(defaults.holes.lostMs + 100);
    expect(simulation.snapshot).toMatchObject({ phase: "universe", universe: 0, universes: 1, status: "flying" });
    expect(phases).toEqual(expect.arrayContaining(["singularity", "lost", "universe"]));
  });

  test("in the universes black holes are kept round the ship, and each one leads somewhere new", () => {
    const simulation = create();
    const universes: number[] = [];

    simulation.events.on("phase", ({ phase, universe }) => {
      if (phase === "universe") {
        universes.push(universe);
      }
    });

    const { x, y } = route.singularity;

    route.bodies.slice(1).forEach((body) => {
      place(simulation, body.x + body.radius * 4, body.y);
      simulation.step(defaults.stepMs);
    });
    place(simulation, x, y);
    simulation.step(defaults.holes.captureMs + defaults.holes.lostMs + 300);

    while (universes.length < 6) {
      expect(simulation.world.stores.hole.size).toBe(defaults.holes.perUniverse);

      const hole = simulation.world.stores.hole.entities[0];
      const at = simulation.world.stores.body.get(hole);

      if (at) {
        place(simulation, at.x, at.y);
      }

      simulation.step(defaults.holes.captureMs + defaults.holes.jumpMs + 300);
    }

    universes.slice(1).forEach((universe, index) => expect(universe).not.toBe(universes[index]));
    expect(new Set(universes.slice(0, defaults.universes)).size).toBe(defaults.universes);
  });

  test("time runs slow by a black hole, and the telemetry says so", () => {
    const simulation = create();

    route.bodies.slice(1).forEach((body) => {
      place(simulation, body.x + body.radius * 4, body.y);
      simulation.step(defaults.stepMs);
    });
    place(simulation, route.singularity.x, route.singularity.y + defaults.holes.singularityHorizon * 1.5);
    simulation.step(defaults.stepMs);

    expect(simulation.snapshot.telemetry.timeDilation).toBeGreaterThan(1.5);
  });
});

describe("space round the ship", () => {
  test("rocks are kept at the density of the region, and what is left far behind is let go", () => {
    const simulation = create({ spawn: { ...defaults.spawn, pickups: 0 } });
    const belt = route.belts[0];

    simulation.step(500);
    expect(simulation.world.stores.hazard.size).toBe(defaults.spawn.open);

    place(simulation, 0, -(belt.inner + belt.outer) / 2);
    simulation.step(defaults.stepMs * 2);
    expect(simulation.world.stores.hazard.size).toBe(Math.round(defaults.spawn.belt * belt.density));
  });

  test("the same seed and input fly the same voyage", () => {
    const first = create({ spawn: defaults.spawn }, 42);
    const second = create({ spawn: defaults.spawn }, 42);

    first.step(8000, burn(0.6, { x: 3, y: -40 }));
    second.step(8000, burn(0.6, { x: 3, y: -40 }));

    expect(second.snapshot).toEqual(first.snapshot);
  });

  test("speed reads in km/s, and distance from the Sun in AU grows on the way out", () => {
    const simulation = create();

    place(simulation, 0, -route.length / 2, 0, -2);
    simulation.step(defaults.stepMs);

    const { telemetry } = simulation.snapshot;

    expect(telemetry.speedKmS).toBeCloseTo(2 * defaults.units.kmPerSecond, 0);
    expect(telemetry.au).toBeGreaterThan(9);
    expect(telemetry.au).toBeLessThan(11);
  });
});

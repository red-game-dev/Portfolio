import { InMemoryContentSource } from "@/packages/core/content";
import {
  auForRadius,
  DEFAULT_VOYAGE_CONFIG,
  NO_INPUT,
  placeBodies,
  radiusForAu,
  resolveVoyageConfig,
  SOLAR_SYSTEM,
  SolarSystemSource,
  StarSystem,
  SystemService,
  VoyageConfig,
  VoyageInput,
  VoyageSimulation,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const defaults = DEFAULT_VOYAGE_CONFIG;
// Noon UTC on 9 October 2026: every test flies the same sky.
const EPOCH = Date.parse("2026-10-09T12:00:00Z");
const HOUR = 3600000;

const systemOf = (): StarSystem => new SystemService(new SolarSystemSource(), defaults.layout).getView();

// Nothing spawns round the ship and the star stays quiet, so a test sees only what it sets up.
const CALM: Partial<VoyageConfig> = {
  spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0, cometEvery: [1e6, 1e6] },
  weather: { ...defaults.weather, every: [1e6, 1e6] },
};

const create = (overrides: Partial<VoyageConfig> = {}, seed = 7) => {
  const simulation = new VoyageSimulation(systemOf(), { config: resolveVoyageConfig({ ...CALM, ...overrides }), random: createSeededRandom(seed), epochMs: EPOCH });

  simulation.setView(2, 1.4);
  simulation.start();

  return simulation;
};

const bodyOf = (simulation: VoyageSimulation, id: string) => {
  const found = simulation.state.system.bodies.find((body) => body.id === id);

  if (!found) {
    throw new Error(`no ${id} in the system`);
  }

  return found;
};

const partsOf = (simulation: VoyageSimulation) => {
  const { stores } = simulation.world;
  const body = stores.body.get(simulation.state.ship);
  const ship = stores.ship.get(simulation.state.ship);
  const health = stores.health.get(simulation.state.ship);
  const modules = stores.modules.get(simulation.state.ship);

  if (!body || !ship || !health || !modules) {
    throw new Error("the ship is gone");
  }

  return { body, ship, health, modules };
};

const place = (simulation: VoyageSimulation, x: number, y: number, vx = 0, vy = 0) => {
  Object.assign(partsOf(simulation).body, { x, y, prevX: x, prevY: y, vx, vy });
};

// A point at a distance from the star in the direction furthest from every body, so nothing but the star is near.
const openSpace = (simulation: VoyageSimulation, distance: number) => {
  const { star, bodies } = simulation.state.system;
  let best = { x: 0, y: 0, clearance: -1 };

  for (let step = 0; step < 72; step += 1) {
    const angle = (step / 72) * Math.PI * 2;
    const x = star.x + Math.cos(angle) * distance;
    const y = star.y + Math.sin(angle) * distance;
    const clearance = Math.min(...bodies.map((body) => Math.hypot(body.x - x, body.y - y) - body.radius));

    if (clearance > best.clearance) {
      best = { x, y, clearance };
    }
  }

  return best;
};

const burn = (thrust: number, aim: { x: number; y: number } | null = null): VoyageInput => ({ ...NO_INPUT, thrust, aim });

describe("the real solar system", () => {
  test("every planet sits in its real direction from the Sun, further out the further it really is", () => {
    const system = systemOf();
    const { star } = system;

    placeBodies(system, EPOCH);

    const planets = system.bodies.filter((body) => body.kind !== "moon");
    const byDistance = [...planets].sort((first, second) => Math.hypot(first.x - star.x, first.y - star.y) - Math.hypot(second.x - star.x, second.y - star.y));

    expect(byDistance.map((body) => body.id)).toEqual([...planets].sort((first, second) => first.au - second.au).map((body) => body.id));
    planets.forEach((body) => {
      expect(Math.atan2(-(body.y - star.y), body.x - star.x)).toBeCloseTo(Math.atan2(body.real.y, body.real.x), 6);
      expect(Math.hypot(body.x - star.x, body.y - star.y)).toBeCloseTo(radiusForAu(system.scale, body.au), 6);
    });
  });

  test("Earth's orbit is the scale's unit, and the Sun's surface maps back to its real radius", () => {
    const { scale, star } = systemOf();

    expect(radiusForAu(scale, 1)).toBeCloseTo(defaults.layout.unitsPerRootAu, 6);
    expect(auForRadius(scale, star.radius)).toBeCloseTo(scale.starRadiusAu, 8);
    [0.01, 0.2, 0.387, 1, 5.2, 39.5].forEach((au) => expect(auForRadius(scale, radiusForAu(scale, au))).toBeCloseTo(au, 6));
  });

  test("refuses data whose rules the layout depends on", () => {
    const twice = { ...SOLAR_SYSTEM, bodies: [...SOLAR_SYSTEM.bodies, SOLAR_SYSTEM.bodies[0]] };
    const orphan = { ...SOLAR_SYSTEM, bodies: SOLAR_SYSTEM.bodies.filter((body) => body.id !== "earth") };

    expect(() => new SystemService(new InMemoryContentSource(twice), defaults.layout).getView()).toThrow();
    expect(() => new SystemService(new InMemoryContentSource(orphan), defaults.layout).getView()).toThrow();
    expect(() => new SystemService(new InMemoryContentSource({ bodies: "none" }), defaults.layout).getView()).toThrow();
  });

  test.each([["earth", 9.81], ["moon", 1.62], ["mars", 3.72], ["jupiter", 24.79], ["pluto", 0.62]])("%s's surface gravity reads true in telemetry", (id, gravity) => {
    const simulation = create();
    const body = bodyOf(simulation, String(id));

    place(simulation, body.x, body.y - body.radius * 1.001);
    simulation.step(defaults.stepMs);

    expect(simulation.snapshot.telemetry.gravity).toBeCloseTo(Number(gravity), 0);
    expect(simulation.snapshot.telemetry.dominant).toBe(id);
  });

  test("in open space at Earth's distance the Sun pulls hardest, with its real 0.006 m/s^2", () => {
    const simulation = create();
    const spot = openSpace(simulation, radiusForAu(simulation.state.system.scale, 1));

    place(simulation, spot.x, spot.y);
    simulation.step(defaults.stepMs);

    expect(simulation.snapshot.telemetry.dominant).toBe("sun");
    expect(simulation.snapshot.telemetry.gravity).toBeCloseTo(0.0059, 3);
  });

  test("the clock moves the planets round their orbits and the moons round their planets, each at its real rate", () => {
    const system = systemOf();
    const angleRound = (id: string, parentId: string) => {
      const body = system.bodies.find((candidate) => candidate.id === id);
      const parent = system.bodies.find((candidate) => candidate.id === parentId);

      return body && parent ? Math.atan2(-(body.y - parent.y), body.x - parent.x) : NaN;
    };
    const turned = (from: number, to: number) => ((((to - from) * 180) / Math.PI) % 360 + 360) % 360;

    placeBodies(system, EPOCH);
    const moon = angleRound("moon", "earth");
    const io = angleRound("io", "jupiter");

    placeBodies(system, EPOCH + 30 * HOUR);

    // In 30 hours the Moon goes 16.5 degrees round Earth and Io 254 round Jupiter.
    expect(turned(moon, angleRound("moon", "earth"))).toBeCloseTo((360 * 1.25) / 27.321661, 1);
    expect(turned(io, angleRound("io", "jupiter"))).toBeCloseTo(((360 * 1.25) / 1.769138) % 360, 1);
  });

  test("at noon UTC the Sun stands over Greenwich, and the mission clock runs at the configured pace", () => {
    const simulation = create();

    expect(Math.abs(bodyOf(simulation, "earth").subsolarLongitude)).toBeLessThan(5);
    simulation.step(2000);
    // Within a step or two of the two seconds flown.
    expect(Math.abs(simulation.snapshot.telemetry.missionTime - (EPOCH + 2 * defaults.clock.hoursPerSecond * HOUR))).toBeLessThan(40000);
  });
});

describe("flight", () => {
  test("a burn pushes along the nose and costs fuel; an empty tank pushes nothing", () => {
    const simulation = create();
    const spot = openSpace(simulation, 40);

    place(simulation, spot.x, spot.y);
    partsOf(simulation).ship.angle = 0;
    simulation.step(1000, burn(1));
    expect(partsOf(simulation).body.vx).toBeGreaterThan(1);
    expect(partsOf(simulation).ship.fuel).toBeLessThan(defaults.ship.fuel);

    partsOf(simulation).ship.fuel = 0;
    place(simulation, spot.x, spot.y);
    simulation.step(500, burn(1));
    expect(Math.abs(partsOf(simulation).body.vx)).toBeLessThan(0.05);
  });

  test("the ship turns towards the aim at its turn rate, and the brake slows it", () => {
    const simulation = create();
    const spot = openSpace(simulation, 40);

    place(simulation, spot.x, spot.y, 2, 0);
    partsOf(simulation).ship.angle = 0;
    simulation.step(100, { ...NO_INPUT, aim: { x: spot.x, y: spot.y + 5 } });
    expect(partsOf(simulation).ship.angle).toBeCloseTo(defaults.ship.turnRate * 0.1, 1);

    simulation.step(1000, { ...NO_INPUT, brake: true });
    expect(Math.hypot(partsOf(simulation).body.vx, partsOf(simulation).body.vy)).toBeLessThan(1);
  });

  test("left alone near Jupiter, the ship falls towards it", () => {
    const simulation = create();
    const jupiter = bodyOf(simulation, "jupiter");
    const start = { x: jupiter.x + jupiter.radius * 3, y: jupiter.y };

    place(simulation, start.x, start.y, jupiter.vx, jupiter.vy);
    simulation.step(1500);

    expect(Math.hypot(partsOf(simulation).body.x - jupiter.x, partsOf(simulation).body.y - jupiter.y)).toBeLessThan(jupiter.radius * 3);
  });
});

describe("surfaces and air", () => {
  test("touching Mars slowly is a landing that rides along with it and scores once it is down; a burn lifts off", () => {
    const simulation = create();
    const mars = bodyOf(simulation, "mars");
    const scoreBefore = simulation.state.score;

    place(simulation, mars.x, mars.y - mars.radius - defaults.ship.radius - 0.001, mars.vx, mars.vy + 0.1);
    simulation.step(200);

    expect(partsOf(simulation).ship.landedOn).toBe("mars");

    for (let waited = 0; simulation.state.descent?.downAt === null && waited < 30000; waited += 250) {
      simulation.step(250);
    }

    expect(simulation.state.score - scoreBefore).toBeGreaterThanOrEqual(defaults.scoring.landing);

    simulation.step(3000);
    const offset = Math.hypot(partsOf(simulation).body.x - mars.x, partsOf(simulation).body.y - mars.y);

    expect(offset).toBeCloseTo(mars.radius + defaults.ship.radius, 3);

    partsOf(simulation).ship.angle = -Math.PI / 2;
    simulation.step(300, burn(1));
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("hitting a rocky surface fast is a crash: damage, and a bounce", () => {
    const simulation = create();
    const moon = bodyOf(simulation, "moon");

    place(simulation, moon.x, moon.y - moon.radius - defaults.ship.radius - 0.01, moon.vx, moon.vy + 2.5);
    simulation.step(100);

    const { body, health } = partsOf(simulation);

    expect(health.shields + health.hull).toBeLessThan(defaults.ship.shields + defaults.ship.hull);
    expect(body.vy - moon.vy).toBeLessThan(0);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("Earth's air drags and heats a fast ship; Jupiter's upper air refills the tank", () => {
    const simulation = create();
    const earth = bodyOf(simulation, "earth");
    const jupiter = bodyOf(simulation, "jupiter");

    place(simulation, earth.x, earth.y - earth.radius - defaults.ship.radius - 0.015, earth.vx + 3, earth.vy);
    simulation.step(200);
    expect(Math.hypot(partsOf(simulation).body.vx - earth.vx, partsOf(simulation).body.vy - earth.vy)).toBeLessThan(3);
    expect(partsOf(simulation).ship.temperatureC).toBeGreaterThan(50);

    partsOf(simulation).ship.fuel = 10;
    place(simulation, jupiter.x - jupiter.radius - defaults.ship.radius - 0.05, jupiter.y, jupiter.vx, jupiter.vy);
    simulation.step(100);
    expect(partsOf(simulation).ship.fuel).toBeGreaterThan(10);
  });

  test("too deep in a giant the warm up throws the ship clear; outside the warm up the pressure crushes the hull", () => {
    const safe = create();
    const strict = create({ isSolarSafe: false });
    const jupiter = bodyOf(safe, "jupiter");
    const emergencies: string[] = [];

    safe.events.on("emergency", ({ body }) => emergencies.push(body));
    place(safe, jupiter.x - jupiter.radius * 0.7, jupiter.y, jupiter.vx, jupiter.vy);
    safe.step(defaults.stepMs * 2);
    expect(emergencies).toEqual(["jupiter"]);
    expect(Math.hypot(partsOf(safe).body.x - jupiter.x, partsOf(safe).body.y - jupiter.y)).toBeGreaterThan(jupiter.radius);

    const strictJupiter = bodyOf(strict, "jupiter");

    place(strict, strictJupiter.x - strictJupiter.radius * 0.7, strictJupiter.y, strictJupiter.vx, strictJupiter.vy);
    strict.step(400);
    expect(partsOf(strict).health.hull).toBeLessThan(defaults.ship.hull);
  });

  test("low over Venus the air is 92 bar of 464 degree heat: it cooks the sensors and shields, and crushes the hull", () => {
    const simulation = create();
    const venus = bodyOf(simulation, "venus");
    const failing: string[] = [];

    // Held just above the ground as Venus moves, never touching it (a touch would begin a landing's way down).
    const low = () => venus.y - venus.radius - defaults.ship.radius - 0.0005;

    simulation.events.on("failing", ({ module }) => failing.push(module));
    partsOf(simulation).ship.landedOn = null;
    place(simulation, venus.x, low(), venus.vx, venus.vy);
    simulation.step(defaults.stepMs);
    expect(simulation.snapshot.telemetry.pressureBar).toBeGreaterThan(80);

    for (let elapsed = 0; elapsed < 6000; elapsed += defaults.stepMs) {
      place(simulation, venus.x, low(), venus.vx, venus.vy);
      simulation.step(defaults.stepMs);
    }

    expect(partsOf(simulation).ship.landedOn).toBeNull();

    expect(simulation.snapshot.telemetry.hullTemperatureC).toBeGreaterThan(400);
    expect(failing).toEqual(expect.arrayContaining(["sensors", "shields"]));
    expect(partsOf(simulation).health.hull).toBeLessThan(defaults.ship.hull);
  });
});

describe("heat and cold", () => {
  test("near the Sun the ship melts system by system, the sensors first, and the warm up does not save it", () => {
    const simulation = create();
    const failing: string[] = [];
    const melting: number[] = [];
    const { star, scale } = simulation.state.system;
    const close = radiusForAu(scale, 0.03);

    simulation.events.on("failing", ({ module }) => failing.push(module));
    simulation.events.on("melting", ({ temperatureC }) => melting.push(temperatureC));

    for (let second = 0; second < 25 && simulation.state.status === "flying"; second += 1) {
      place(simulation, star.x + close, star.y);
      simulation.step(1000);
    }

    expect(failing[0]).toBe("sensors");
    expect(melting.length).toBeGreaterThan(0);
    expect(simulation.state.status).toBe("over");
  });

  test("far out it is the cold of the outer system, and in a planet's shadow the sunlight is gone", () => {
    const far = create();
    const spot = openSpace(far, radiusForAu(far.state.system.scale, 30));

    place(far, spot.x, spot.y);
    far.step(defaults.stepMs);
    expect(far.snapshot.telemetry.outsideC).toBeCloseTo(278.6 / Math.sqrt(30) - 273.15, -1);

    const near = create();
    const earth = bodyOf(near, "earth");
    const { star } = near.state.system;
    const out = Math.hypot(earth.x - star.x, earth.y - star.y);

    place(near, earth.x + ((earth.x - star.x) / out) * earth.radius * 1.4, earth.y + ((earth.y - star.y) / out) * earth.radius * 1.4);
    near.step(defaults.stepMs);
    expect(near.snapshot.telemetry.sunlight).toBe(0);
  });
});

describe("the star's weather", () => {
  test("a flare throws a storm that drains the shields and burns the sensors when it reaches the ship", () => {
    const simulation = create({ weather: { ...defaults.weather, every: [0.5, 0.5], heading: 1, speed: [2, 2], width: [1, 1] } });
    const flares: string[] = [];
    const storms: number[] = [];
    const { star } = simulation.state.system;

    simulation.events.on("flare", ({ class: flareClass }) => flares.push(flareClass));
    simulation.events.on("storm", ({ strength }) => storms.push(strength));

    for (let tick = 0; tick < 30 && storms.length === 0; tick += 1) {
      place(simulation, star.x + star.radius * 2.5, star.y);
      partsOf(simulation).ship.temperatureC = 20;
      simulation.step(100);
    }

    expect(flares.length).toBeGreaterThan(0);
    expect(storms.length).toBeGreaterThan(0);
    expect(partsOf(simulation).health.shields).toBeLessThan(defaults.ship.shields);
    expect(partsOf(simulation).modules.sensors).toBeLessThan(1);
  });

  test("comets fall in from out of sight", () => {
    const simulation = create({ spawn: { ...defaults.spawn, open: 0, belt: 0, pickups: 0, cometEvery: [0.1, 0.1] } });

    simulation.step(300);

    expect(simulation.world.stores.hazard.values.some((hazard) => hazard.isComet)).toBe(true);
  });
});

describe("the way out and beyond", () => {
  const crossEdge = (simulation: VoyageSimulation) => {
    const { star, edge } = simulation.state.system;
    const spot = openSpace(simulation, edge + 0.5);
    const out = Math.hypot(spot.x - star.x, spot.y - star.y);

    place(simulation, spot.x, spot.y, ((spot.x - star.x) / out) * 1, ((spot.y - star.y) / out) * 1);
    simulation.step(defaults.stepMs);
  };

  const singularityOf = (simulation: VoyageSimulation) => {
    const { stores } = simulation.world;
    const entity = stores.hole.entities.find((candidate) => stores.hole.get(candidate)?.isSingularity);
    const at = entity !== undefined ? stores.body.get(entity) : undefined;

    if (!at) {
      throw new Error("no singularity");
    }

    return at;
  };

  test("past the edge of the system the singularity wakes ahead, takes the ship, and it wakes in the first universe", () => {
    const simulation = create();
    const phases: string[] = [];

    simulation.events.on("phase", ({ phase }) => phases.push(phase));
    crossEdge(simulation);
    expect(simulation.state.phase).toBe("singularity");
    expect(simulation.snapshot.waypoint?.id).toBe("singularity");

    const hole = singularityOf(simulation);

    place(simulation, hole.x, hole.y + defaults.holes.singularityHorizon * 0.9);
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
    crossEdge(simulation);

    const first = singularityOf(simulation);

    place(simulation, first.x, first.y);
    simulation.step(defaults.holes.captureMs + defaults.holes.lostMs + 300);

    for (let attempt = 0; universes.length < 6 && attempt < 12; attempt += 1) {
      expect(simulation.world.stores.hole.size).toBe(defaults.holes.perUniverse);

      const hole = simulation.world.stores.hole.entities[0];
      const at = simulation.world.stores.body.get(hole);

      if (at) {
        place(simulation, at.x, at.y);
      }

      simulation.step(defaults.holes.captureMs + defaults.holes.jumpMs + 300);
    }

    expect(universes).toHaveLength(6);
    universes.slice(1).forEach((universe, index) => expect(universe).not.toBe(universes[index]));
    expect(new Set(universes.slice(0, defaults.universes)).size).toBe(defaults.universes);
  });

  test("time runs slow by a black hole, and the telemetry says so", () => {
    const simulation = create();

    crossEdge(simulation);

    const hole = singularityOf(simulation);

    place(simulation, hole.x, hole.y + defaults.holes.singularityHorizon * 1.5);
    simulation.step(defaults.stepMs);

    expect(simulation.snapshot.telemetry.timeDilation).toBeGreaterThan(1.5);
  });

  test("the compass points to the nearest place not yet visited, then out to the edge", () => {
    const simulation = create();
    const target = simulation.state.waypoint;

    simulation.step(defaults.stepMs);
    expect(simulation.snapshot.waypoint?.id).not.toBe("earth");
    expect(target === null || target.id !== "earth").toBe(true);

    simulation.state.system.bodies.forEach((body) => simulation.state.passed.add(body.id));
    simulation.state.passed.add("sun");
    simulation.step(defaults.stepMs);
    expect(simulation.snapshot.waypoint?.id).toBe("edge");
  });
});

describe("the ship's systems", () => {
  test("a rock to the nose wears the sensors; shields take hits first and come back after a pause", () => {
    const simulation = create({ isSolarSafe: false });
    const spot = openSpace(simulation, 40);
    const { body, ship, health, modules } = partsOf(simulation);

    place(simulation, spot.x, spot.y);
    ship.angle = 0;
    health.shields = 50;

    const rock = simulation.world.spawn();

    simulation.world.stores.body.set(rock, { x: body.x + 0.1, y: body.y, vx: -3, vy: 0, prevX: body.x + 0.1, prevY: body.y, radius: 0.1, mass: 1 });
    simulation.world.stores.hazard.set(rock, { shape: 0, isIcy: false, isComet: false });
    simulation.step(defaults.stepMs);

    expect(health.shields).toBe(0);
    expect(health.decals).toHaveLength(1);
    expect(Math.abs(health.decals[0].angle)).toBeLessThan(0.5);
    expect(modules.sensors).toBeLessThan(1);

    simulation.step(defaults.ship.shieldDelayMs + 1000);
    expect(health.shields).toBeGreaterThan(0);
  });

  test("melted engines push far less, and a lost shield generator holds no shields", () => {
    const simulation = create();
    const spot = openSpace(simulation, 40);
    const { ship, modules, health } = partsOf(simulation);

    place(simulation, spot.x, spot.y);
    ship.angle = 0;
    simulation.step(500, burn(1));
    const sound = partsOf(simulation).body.vx;

    place(simulation, spot.x, spot.y);
    modules.engines = 0;
    simulation.step(500, burn(1));
    expect(partsOf(simulation).body.vx).toBeLessThan(sound * 0.5);

    modules.shields = 0;
    simulation.step(defaults.stepMs);
    expect(health.shields).toBe(0);
  });
});

describe("space round the ship", () => {
  test("rocks are kept at the density of the belt the ship is in", () => {
    const simulation = create({ spawn: { ...defaults.spawn, pickups: 0, cometEvery: [1e6, 1e6] } });
    const belt = simulation.state.system.belts[0];
    const spot = openSpace(simulation, (belt.inner + belt.outer) / 2);

    place(simulation, spot.x, spot.y);
    simulation.step(defaults.stepMs * 2);
    expect(simulation.world.stores.hazard.size).toBe(Math.round(defaults.spawn.belt * belt.density));
  });

  test("the same seed, clock and input fly the same voyage", () => {
    const first = create({ spawn: defaults.spawn, weather: defaults.weather }, 42);
    const second = create({ spawn: defaults.spawn, weather: defaults.weather }, 42);

    first.step(8000, burn(0.6, { x: 3, y: -40 }));
    second.step(8000, burn(0.6, { x: 3, y: -40 }));

    expect(second.snapshot).toEqual(first.snapshot);
  });

  test("speed reads in km/s, and the distance from the Sun in AU", () => {
    const simulation = create();
    const spot = openSpace(simulation, radiusForAu(simulation.state.system.scale, 10));

    place(simulation, spot.x, spot.y, 0, -2);
    simulation.step(defaults.stepMs);

    const { telemetry } = simulation.snapshot;

    expect(telemetry.speedKmS).toBeCloseTo(2 * defaults.units.kmPerSecond, 0);
    expect(telemetry.au).toBeCloseTo(10, 0);
  });

  test("every run flies a fresh copy of the system, so nothing done to a world in one run is there in the next", () => {
    const simulation = create();
    const marsOf = () => simulation.state.system.bodies.find((body) => body.id === "mars");
    const before = marsOf();

    if (!before) {
      throw new Error("no Mars");
    }

    const { mu, air } = before;

    Object.assign(before, { mu: 0, air: null });
    simulation.start();

    expect(marsOf()).not.toBe(before);
    expect(marsOf()?.mu).toBe(mu);
    expect(marsOf()?.air).toEqual(air);
  });
});

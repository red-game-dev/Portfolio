import { ManualScheduler } from "@/packages/animation/frame-loop";
import {
  DEFAULT_VOYAGE_CONFIG,
  resolveVoyageConfig,
  SOLAR_ROUTE,
  VoyageConfigOverrides,
  VoyageGame,
  VoyageInput,
  VoyageRenderer,
  VoyageSimulation,
  VoyageSnapshot,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const PHONE = { width: 390, height: 760 };
const NEVER = 1e12;
// Nothing to hit or catch, so a test can watch one thing at a time.
const CALM: VoyageConfigOverrides = {
  route: SOLAR_ROUTE.map((stop) => (stop.every ? { ...stop, every: NEVER } : stop)),
  hazardEveryMs: NEVER,
  universeHazardEveryMs: NEVER,
  minHazardEveryMs: NEVER,
  pickupEveryMs: NEVER,
  shieldEveryMs: NEVER,
};

const create = (overrides: VoyageConfigOverrides = {}, seed = 7) => {
  const simulation = new VoyageSimulation(PHONE, { config: resolveVoyageConfig({ ...CALM, ...overrides }), random: createSeededRandom(seed) });

  simulation.start();

  return simulation;
};

const still: VoyageInput = { direction: { x: 0, y: 0 }, target: null };

const run = (simulation: VoyageSimulation, ms: number, input: (simulation: VoyageSimulation) => VoyageInput = () => still, stepMs = 16) => {
  for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
    simulation.step(stepMs, input(simulation));
  }
};

const runUntil = (simulation: VoyageSimulation, done: (simulation: VoyageSimulation) => boolean, limitMs: number,
  input: (simulation: VoyageSimulation) => VoyageInput = () => still) => {
  for (let elapsed = 0; elapsed < limitMs && !done(simulation); elapsed += 16) {
    simulation.step(16, input(simulation));
  }
};

// Out past Pluto and through the singularity into the first universe.
const reachUniverses = (simulation: VoyageSimulation) => {
  runUntil(simulation, ({ state }) => state.phase === "universe", DEFAULT_VOYAGE_CONFIG.solarMs + 20000);
};

describe("VoyageSimulation", () => {
  test("passes the Moon, Mars, the belt and every planet out to Pluto in order, at their distances from the Sun", () => {
    const simulation = create();
    const passed: string[] = [];

    runUntil(simulation, ({ state }) => {
      if (state.passing && passed[passed.length - 1] !== state.passing) {
        passed.push(state.passing);
      }

      return state.phase !== "solar";
    }, DEFAULT_VOYAGE_CONFIG.solarMs + 1000);

    expect(passed).toEqual(SOLAR_ROUTE.map((stop) => stop.id));
    expect(simulation.state.phase).toBe("singularity");
    expect(simulation.snapshot.au).toBe(39.5);
  });

  test("the distance grows slowly at first, so the inner planets are not crowded together", () => {
    const simulation = create();

    run(simulation, DEFAULT_VOYAGE_CONFIG.solarMs / 4);
    expect(simulation.state.au).toBeLessThan(4);

    run(simulation, DEFAULT_VOYAGE_CONFIG.solarMs / 4);
    expect(simulation.state.au).toBeGreaterThan(9);
  });

  test("the singularity past Pluto takes the ship whatever it does, and the ship comes out in the first universe", () => {
    const simulation = create();
    const fleeing = (): VoyageInput => ({ direction: { x: 0, y: 1 }, target: null });

    runUntil(simulation, ({ state }) => state.phase === "singularity", DEFAULT_VOYAGE_CONFIG.solarMs + 1000);
    const scoreBefore = simulation.state.score;

    runUntil(simulation, ({ state }) => state.phase === "lost", DEFAULT_VOYAGE_CONFIG.singularityMs + DEFAULT_VOYAGE_CONFIG.captureMs + 500, fleeing);
    expect(simulation.state.phase).toBe("lost");

    runUntil(simulation, ({ state }) => state.phase === "universe", DEFAULT_VOYAGE_CONFIG.lostMs + 100);
    expect(simulation.snapshot).toMatchObject({ phase: "universe", universe: 0, universes: 1, status: "flying" });
    expect(simulation.state.score - scoreBefore).toBeGreaterThanOrEqual(DEFAULT_VOYAGE_CONFIG.scoring.universe);
  });

  test("a black hole in the universes throws the ship somewhere it has not been, never where it just was", () => {
    const simulation = create({ holeEveryMs: [400, 600] });
    const towardsTheHole = ({ state }: VoyageSimulation): VoyageInput => ({
      direction: { x: 0, y: 0 },
      target: state.hole ? { x: state.hole.x, y: state.hole.y } : null,
    });
    const universes: number[] = [];

    reachUniverses(simulation);
    universes.push(simulation.state.universe);

    while (universes.length < 6) {
      const before = simulation.state.universes;

      runUntil(simulation, ({ state }) => state.universes > before, 20000, towardsTheHole);
      expect(simulation.state.universes).toBe(before + 1);
      universes.push(simulation.state.universe);
    }

    universes.slice(1).forEach((universe, index) => expect(universe).not.toBe(universes[index]));
    expect(new Set(universes.slice(0, DEFAULT_VOYAGE_CONFIG.universes)).size).toBe(DEFAULT_VOYAGE_CONFIG.universes);
  });

  test("an ordinary black hole can be escaped at full thrust", () => {
    const simulation = create({ holeEveryMs: [400, 600] });
    const away = ({ state }: VoyageSimulation): VoyageInput => ({
      direction: { x: state.hole && state.hole.x > state.ship.x ? -1 : 1, y: 1 },
      target: null,
    });

    reachUniverses(simulation);
    run(simulation, 6000, away);

    expect(simulation.state.universes).toBe(1);
  });

  test("a hit costs a shield, the ship cannot be hit again while it recovers, and the run ends with the last shield", () => {
    const simulation = create({ hazardEveryMs: 60 });
    const losses: number[] = [];
    let shields = simulation.state.shields;

    runUntil(simulation, ({ state }) => {
      if (state.shields < shields) {
        losses.push(state.elapsedMs);
        shields = state.shields;
      }

      return state.status === "over";
    }, 60000);

    expect(simulation.snapshot).toMatchObject({ status: "over", shields: 0 });
    expect(losses).toHaveLength(DEFAULT_VOYAGE_CONFIG.shields);
    losses.slice(1).forEach((at, index) => expect(at - losses[index]).toBeGreaterThanOrEqual(DEFAULT_VOYAGE_CONFIG.invulnerableMs));

    const score = simulation.state.score;

    run(simulation, 1000);
    expect(simulation.state.score).toBe(score);
  });

  test("the score is the distance flown, every pickup and every universe reached", () => {
    const simulation = create({ pickupEveryMs: 200 });
    const { perUnit, pickup } = DEFAULT_VOYAGE_CONFIG.scoring;
    const towardsAPickup = ({ state }: VoyageSimulation): VoyageInput => ({
      direction: { x: 0, y: 0 },
      target: state.items[0] ? { x: state.items[0].x, y: state.items[0].y } : null,
    });

    run(simulation, 12000, towardsAPickup);

    expect(simulation.state.pickups).toBeGreaterThan(0);
    expect(simulation.state.score).toBeCloseTo(simulation.state.flown * perUnit + simulation.state.pickups * pickup, 6);
  });

  test("the ship stays on screen however hard it is steered, and keeps its place through a resize", () => {
    const simulation = create();
    const radius = DEFAULT_VOYAGE_CONFIG.shipRadius;

    run(simulation, 2000, () => ({ direction: { x: -1, y: 1 }, target: null }));
    expect(simulation.state.ship.x).toBeCloseTo(radius, 6);
    expect(simulation.state.ship.y).toBeCloseTo(simulation.state.height - radius * 1.6, 6);

    simulation.resize({ width: 1440, height: 900 });
    expect(simulation.state.ship.x).toBeGreaterThanOrEqual(0);
    expect(simulation.state.ship.x).toBeLessThanOrEqual(simulation.state.width);
    expect(simulation.state.ship.y).toBeLessThanOrEqual(simulation.state.height);
  });

  test("the same seed flies the same voyage", () => {
    const first = create({ hazardEveryMs: 300 }, 42);
    const second = create({ hazardEveryMs: 300 }, 42);

    run(first, 20000);
    run(second, 20000);

    expect(second.snapshot).toEqual(first.snapshot);
    expect(second.state.hazards).toEqual(first.state.hazards);
  });
});

describe("VoyageGame", () => {
  const renderer = (): VoyageRenderer & { frames: number } => {
    const drawn = { frames: 0, resize: () => undefined, draw: () => undefined };

    drawn.draw = () => {
      drawn.frames += 1;
    };

    return drawn;
  };

  test("tells the UI what changed a few times a second at most, never once a frame", () => {
    const scheduler = new ManualScheduler();
    const changes: VoyageSnapshot[] = [];
    const draw = renderer();
    const game = new VoyageGame(draw, { scheduler, random: createSeededRandom(3), config: CALM, onChange: (snapshot) => changes.push(snapshot) });

    game.resize(PHONE);
    game.play();

    // Twelve seconds: past Mars and into the asteroid belt.
    for (let time = 0; time < 12000; time += 16) {
      scheduler.tick(time);
    }

    expect(draw.frames).toBeGreaterThan(600);
    expect(changes.length).toBeLessThan(60);
    expect(changes[0]).toMatchObject({ status: "flying", phase: "solar", shields: DEFAULT_VOYAGE_CONFIG.shields });
    expect(changes[changes.length - 1].passing).toBe("belt");
  });

  test("steering by pointer flies the ship towards it, given in pixels on the canvas", () => {
    const scheduler = new ManualScheduler();
    const drawn: Array<{ x: number; y: number }> = [];
    const game = new VoyageGame({
      resize: () => undefined,
      draw: (state) => void drawn.push({ x: state.ship.x * state.unit, y: state.ship.y * state.unit }),
    }, { scheduler, random: createSeededRandom(3), config: CALM });

    game.resize(PHONE);
    game.play();
    game.pointTo(60, 420);

    for (let time = 0; time < 2000; time += 16) {
      scheduler.tick(time);
    }

    const last = drawn[drawn.length - 1];

    expect(last.x).toBeCloseTo(60, 0);
    expect(last.y).toBeCloseTo(420, 0);

    game.pause();
    expect(game.isRunning).toBe(false);
  });
});

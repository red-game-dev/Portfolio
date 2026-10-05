import { BugRaidSimulation, pickKind, resolveBugRaidConfig, spawnInterval } from "@/packages/games/bug-raid";
import { createSeededRandom } from "@/packages/math/random";

const SIZE = { width: 400, height: 300 };

const createSimulation = (overrides = {}) => {
  const config = resolveBugRaidConfig({ spawnEveryMs: 1000, ...overrides });

  return { simulation: new BugRaidSimulation(SIZE, { config, random: createSeededRandom(7) }), config };
};

// Steps in small slices, the way a frame loop would.
const run = (simulation: BugRaidSimulation, totalMs: number, sliceMs = 16) => {
  for (let elapsed = 0; elapsed < totalMs; elapsed += sliceMs) {
    simulation.step(sliceMs);
  }
};

describe("games/bug-raid BugRaidSimulation", () => {
  test("waits in the ready state until started", () => {
    const { simulation } = createSimulation();

    run(simulation, 3000);

    expect(simulation.snapshot).toEqual({ status: "ready", score: 0, lives: 3, wave: 1 });
    expect(simulation.state.bugs).toHaveLength(0);
  });

  test("spawns a bug straight away and then once per interval", () => {
    const { simulation } = createSimulation();

    simulation.start();
    simulation.step(16);
    expect(simulation.state.bugs).toHaveLength(1);

    run(simulation, 2000);
    expect(simulation.state.bugs).toHaveLength(3);
  });

  test("a strike on a bug squashes it, scores and leaves a splat", () => {
    const { simulation, config } = createSimulation({ kinds: { regression: { weight: 0 }, flaky: { weight: 0 } } });

    simulation.start();
    simulation.step(16);

    const [bug] = simulation.state.bugs;

    expect(simulation.strike(bug.x + 5, bug.y)).toBe(true);
    expect(simulation.state.bugs).toHaveLength(0);
    expect(simulation.state.splats).toHaveLength(1);
    expect(simulation.state.score).toBe(config.kinds.bug.points);
  });

  test("a strike out of reach misses", () => {
    const { simulation } = createSimulation();

    simulation.start();
    simulation.step(16);

    const [bug] = simulation.state.bugs;

    expect(simulation.strike(bug.x + 200, bug.y + 200)).toBe(false);
    expect(simulation.state.bugs).toHaveLength(1);
  });

  test("a regression takes two strikes", () => {
    const { simulation } = createSimulation({ kinds: { bug: { weight: 0 }, flaky: { weight: 0 } } });

    simulation.start();
    simulation.step(16);

    const [bug] = simulation.state.bugs;

    simulation.strike(bug.x, bug.y);
    expect(simulation.state.bugs).toHaveLength(1);
    expect(simulation.state.score).toBe(0);

    simulation.strike(bug.x, bug.y);
    expect(simulation.state.bugs).toHaveLength(0);
  });

  test("bugs that reach production cost lives and end the run at zero", () => {
    const { simulation } = createSimulation({ spawnEveryMs: 400, minSpawnEveryMs: 400, lives: 2 });

    simulation.start();
    run(simulation, 30000);

    expect(simulation.snapshot.status).toBe("over");
    expect(simulation.snapshot.lives).toBe(0);
  });

  test("a finished run ignores strikes and stops spawning", () => {
    const { simulation } = createSimulation({ spawnEveryMs: 400, minSpawnEveryMs: 400, lives: 1 });

    simulation.start();
    run(simulation, 30000);

    const bugs = simulation.state.bugs.length;

    run(simulation, 5000);
    expect(simulation.state.bugs).toHaveLength(bugs);
    expect(simulation.strike(SIZE.width / 2, SIZE.height / 2)).toBe(false);
  });

  test("waves advance with time and start resets everything", () => {
    const { simulation, config } = createSimulation({ lives: 1000 });

    simulation.start();
    run(simulation, config.waveEveryMs * 2 + 100);
    expect(simulation.snapshot.wave).toBe(3);

    simulation.start();
    expect(simulation.snapshot).toEqual({ status: "playing", score: 0, lives: 1000, wave: 1 });
    expect(simulation.state.bugs).toHaveLength(0);
  });

  test("the keyboard cursor stays inside the board and strikes where it points", () => {
    const { simulation } = createSimulation();

    simulation.start();
    simulation.aim(-100, -100);
    expect(simulation.state.cursor).toEqual({ x: 0, y: 0, isVisible: true });

    simulation.step(16);

    const [bug] = simulation.state.bugs;

    simulation.state.cursor.x = bug.x;
    simulation.state.cursor.y = bug.y;
    expect(simulation.strikeAtCursor()).toBe(true);
  });

  test("resize keeps bugs on the board", () => {
    const { simulation } = createSimulation();

    simulation.start();
    simulation.step(16);
    simulation.state.bugs[0].x = 390;
    simulation.resize({ width: 100, height: 300 });

    expect(simulation.state.bugs[0].x).toBeLessThanOrEqual(100);
  });

  test("splats fade out on their own", () => {
    const { simulation, config } = createSimulation({ kinds: { regression: { weight: 0 }, flaky: { weight: 0 } } });

    simulation.start();
    simulation.step(16);
    simulation.strike(simulation.state.bugs[0].x, simulation.state.bugs[0].y);
    run(simulation, config.splatMs + 20);

    expect(simulation.state.splats).toHaveLength(0);
  });
});

describe("games/bug-raid spawn utils", () => {
  test("pickKind follows the weights", () => {
    const { kinds } = resolveBugRaidConfig({ kinds: { bug: { weight: 1 }, regression: { weight: 0 }, flaky: { weight: 0 } } });
    const random = createSeededRandom(3);

    expect(Array.from({ length: 50 }, () => pickKind(kinds, random)).every((kind) => kind === "bug")).toBe(true);
  });

  test("spawnInterval shrinks each wave down to its floor", () => {
    expect(spawnInterval(1, 1000, 0.5, 200)).toBe(1000);
    expect(spawnInterval(2, 1000, 0.5, 200)).toBe(500);
    expect(spawnInterval(5, 1000, 0.5, 200)).toBe(200);
  });
});

describe("games/bug-raid cursor", () => {
  test("an unused cursor starts in the middle of the board, even after a resize", () => {
    const config = resolveBugRaidConfig();
    const simulation = new BugRaidSimulation({ width: 0, height: 0 }, { config, random: createSeededRandom(1) });

    simulation.resize({ width: 400, height: 300 });
    expect(simulation.state.cursor).toMatchObject({ x: 200, y: 150 });

    simulation.start();
    simulation.aim(1, 0);
    simulation.resize({ width: 500, height: 300 });
    expect(simulation.state.cursor).toMatchObject({ x: 200 + config.cursorStep, y: 150 });
  });
});

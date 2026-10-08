import { ManualScheduler } from "@/packages/animation/frame-loop";
import { DEFAULT_LAUNCH_CONFIG, LaunchGame, LaunchRenderer, LaunchSimulation, LaunchSnapshot, LaunchState } from "@/packages/games/launch";

const config = DEFAULT_LAUNCH_CONFIG;
const create = () => new LaunchSimulation({ width: 400, height: 260 }, { config, random: () => 0.5 });

const run = (simulation: LaunchSimulation, ms: number, stepMs = 16) => {
  for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
    simulation.step(stepMs);
  }
};

describe("LaunchSimulation", () => {
  test("holding fills the engines and the ship lifts off once they are full", () => {
    const simulation = create();

    simulation.press();
    run(simulation, config.chargeMs / 2);
    expect(simulation.state.status).toBe("charging");
    expect(simulation.state.charge).toBeCloseTo(0.5, 1);

    run(simulation, config.chargeMs / 2 + 32);
    expect(simulation.state.status).toBe("launching");
  });

  test("letting go early drains the engines back to the pad", () => {
    const simulation = create();

    simulation.press();
    run(simulation, config.chargeMs / 3);
    simulation.release();
    run(simulation, config.drainMs);

    expect(simulation.snapshot).toEqual({ status: "ready", passed: 0 });
    expect(simulation.state.charge).toBe(0);
  });

  test("a single press launches without holding, for keyboards, switches and anyone who cannot hold", () => {
    const simulation = create();

    simulation.launch();
    run(simulation, config.autoChargeMs + 32);

    expect(simulation.state.status).toBe("launching");
  });

  test("the climb passes every band in order and settles in orbit", () => {
    const simulation = create();
    const passed: number[] = [];

    simulation.launch();
    run(simulation, config.autoChargeMs + 32);

    while (simulation.state.status === "launching") {
      simulation.step(16);
      passed.push(simulation.state.passed);
    }

    expect(passed).toEqual([...passed].sort((first, second) => first - second));
    expect(new Set(passed)).toEqual(new Set([0, 1, 2, 3, 4, 5].filter((count) => passed.includes(count))));
    expect(simulation.snapshot).toEqual({ status: "orbit", passed: config.markers });
    expect(simulation.state.altitude).toBe(1);
  });

  test("pressing does nothing in flight, completing goes straight to orbit, and reset puts the ship back", () => {
    const simulation = create();

    simulation.complete();
    simulation.press();
    expect(simulation.snapshot).toEqual({ status: "orbit", passed: config.markers });

    simulation.reset();
    expect(simulation.snapshot).toEqual({ status: "ready", passed: 0 });
    expect(simulation.state.altitude).toBe(0);
  });
});

describe("LaunchGame", () => {
  const renderer = (): LaunchRenderer & { frames: LaunchState[] } => {
    const frames: LaunchState[] = [];

    return { frames, resize: () => undefined, draw: (state) => void frames.push({ ...state }) };
  };

  test("reports only changes, runs only while something moves, and stops in orbit", () => {
    const scheduler = new ManualScheduler();
    const changes: LaunchSnapshot[] = [];
    const game = new LaunchGame(renderer(), { scheduler, random: () => 0.5, onChange: (snapshot) => changes.push(snapshot) });

    game.resize({ width: 400, height: 260 });
    expect(game.isRunning).toBe(false);

    game.launch();
    expect(game.isRunning).toBe(true);

    for (let time = 0; time < 8000 && game.isRunning; time += 16) {
      scheduler.tick(time);
    }

    expect(game.isRunning).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(["charging", "launching", ...Array(config.markers).fill("launching"), "orbit"]);
    expect(changes[changes.length - 1]).toEqual({ status: "orbit", passed: config.markers });
  });

  test("completing for reduced motion draws one still frame in orbit without running the loop", () => {
    const draw = renderer();
    const game = new LaunchGame(draw, { scheduler: new ManualScheduler(), random: () => 0.5 });

    game.resize({ width: 400, height: 260 });
    game.complete();

    expect(game.isRunning).toBe(false);
    expect(draw.frames[draw.frames.length - 1].status).toBe("orbit");
  });
});

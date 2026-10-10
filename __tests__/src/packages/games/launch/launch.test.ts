import { ManualScheduler } from "@/packages/animation/frame-loop";
import {
  ALTITUDE_KM, CLOCK_S, DEFAULT_LAUNCH_CONFIG, DEFAULT_LAUNCH_SITE, LaunchGame, LaunchRenderer, LaunchSimulation, LaunchSnapshot, LaunchState, LaunchVehicle, profileAt,
  SPEED_KMH, VEHICLES,
} from "@/packages/games/launch";

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

    expect(simulation.snapshot).toEqual({ status: "ready", passed: 0, countdown: 0, milestone: null });
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
    expect(simulation.snapshot).toEqual({ status: "orbit", passed: config.markers, countdown: 0, milestone: "seco" });
    expect(simulation.state.altitude).toBe(1);
  });

  test("climbs as a real launch does: height, speed and the mission clock only rise, ending at orbit", () => {
    const simulation = create();
    const readings: Array<[number, number, number]> = [];

    simulation.launch();

    while (simulation.state.status !== "orbit") {
      simulation.step(16);
      readings.push([simulation.state.altitudeKm, simulation.state.speedKmh, simulation.state.missionSeconds]);
    }

    [0, 1, 2].forEach((column) => {
      const values = readings.map((reading) => reading[column]);

      expect(values).toEqual([...values].sort((first, second) => first - second));
    });
    expect(simulation.state.altitudeKm).toBe(200);
    expect(simulation.state.speedKmh).toBe(27500);
    // Max Q a minute or so in, near 12 km.
    expect(profileAt(ALTITUDE_KM, 0.2)).toBe(12);
    expect(profileAt(CLOCK_S, 0.2)).toBe(72);
    expect(profileAt(SPEED_KMH, 0.1)).toBeGreaterThan(160);
  });

  test("every rocket calls out its own five moments in order, the last before orbit", () => {
    (["booster", "heavy", "steel"] as LaunchVehicle[]).forEach((vehicle) => {
      const simulation = new LaunchSimulation({ width: 400, height: 260 }, { config, random: () => 0.5, site: { ...DEFAULT_LAUNCH_SITE, vehicle } });
      const called: string[] = [];

      simulation.launch();

      while (simulation.state.status !== "orbit") {
        simulation.step(16);

        const { milestone } = simulation.snapshot;

        if (milestone && called[called.length - 1] !== milestone) {
          called.push(milestone);
        }
      }

      expect(called).toEqual(VEHICLES[vehicle].milestones.map(([id]) => id));
      expect(called).toHaveLength(config.markers);
    });
  });

  test("the Sun stands over the pad where it really is: night at a Florida midnight, high at its noon", () => {
    const at = (iso: string) => new LaunchSimulation({ width: 400, height: 260 }, { config, random: () => 0.5, epochMs: Date.parse(iso) }).state;

    expect(at("2026-10-09T04:00:00Z").sunElevation).toBeLessThan(-30);
    expect(at("2026-10-09T17:00:00Z").sunElevation).toBeGreaterThan(45);
    // Morning sun in the east (the right of the view), afternoon sun in the west.
    expect(at("2026-10-09T13:00:00Z").sunSide).toBeGreaterThan(0);
    expect(at("2026-10-09T20:00:00Z").sunSide).toBeLessThan(0);
  });

  test("the button nobody should press counts down from three, blows the ship up and launches a new one", () => {
    const simulation = create();
    const countdown: number[] = [];

    simulation.selfDestruct();
    expect(simulation.state.status).toBe("ready");

    simulation.complete();
    simulation.selfDestruct();
    expect(simulation.snapshot).toEqual({ status: "destructing", passed: config.markers, countdown: 3, milestone: "seco" });
    expect(simulation.state.debris).toHaveLength(config.debris);

    while (simulation.state.status === "destructing") {
      simulation.step(16);
      countdown.push(simulation.snapshot.countdown);
    }

    expect([...new Set(countdown)]).toEqual([3, 2, 1, 0]);
    expect(simulation.state.status).toBe("exploding");

    run(simulation, config.explodeMs + 32);
    expect(simulation.state.status).toBe("charging");
    expect(simulation.state.isAutoCharging).toBe(true);

    run(simulation, config.autoChargeMs + config.ascentMs + 64);
    expect(simulation.snapshot).toEqual({ status: "orbit", passed: config.markers, countdown: 0, milestone: "seco" });
  });

  test("pressing does nothing in flight, completing goes straight to orbit, and reset puts the ship back", () => {
    const simulation = create();

    simulation.complete();
    simulation.press();
    expect(simulation.snapshot).toEqual({ status: "orbit", passed: config.markers, countdown: 0, milestone: "seco" });

    simulation.reset();
    expect(simulation.snapshot).toEqual({ status: "ready", passed: 0, countdown: 0, milestone: null });
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

    for (let time = 0; time < 12000 && game.isRunning; time += 16) {
      scheduler.tick(time);
    }

    expect(game.isRunning).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(["charging", "launching", ...Array(config.markers).fill("launching"), "orbit"]);
    expect(changes[changes.length - 1]).toEqual({ status: "orbit", passed: config.markers, countdown: 0, milestone: "seco" });
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

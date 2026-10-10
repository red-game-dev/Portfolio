import { NO_INPUT, VoyageEvents, VoyageSimulation } from "@/packages/games/voyage";

import { createFlying, defaults, partsOf, touchDown, untilDown } from "./fixtures/simulation";

const BURN = { ...NO_INPUT, thrust: 1 };

// Every event of a kind the run sends, as it sends them.
const heard = <K extends keyof VoyageEvents>(simulation: VoyageSimulation, kind: K): Array<VoyageEvents[K]> => {
  const all: Array<VoyageEvents[K]> = [];

  simulation.events.on(kind, (payload) => all.push(payload));

  return all;
};

describe("voyage descents", () => {
  test("touching Mars gently begins its real way down; the landing counts only at touchdown, and a burn cannot lift off before it", () => {
    const simulation = createFlying();
    const phases = heard(simulation, "descending");
    const landed = heard(simulation, "landed");

    touchDown(simulation, "mars");

    // Arriving counts as passing Mars; the landing itself is scored later.
    const score = simulation.state.score;

    expect(partsOf(simulation).ship.landedOn).toBe("mars");
    expect(simulation.state.descent?.plan.method).toBe("chuteAndBurn");
    expect(simulation.snapshot.descent?.phase).toBe("entry");
    expect(landed).toHaveLength(0);
    expect(simulation.state.landings.has("mars")).toBe(false);

    simulation.step(500, BURN);
    expect(partsOf(simulation).ship.landedOn).toBe("mars");

    const took = untilDown(simulation);

    // Mars's eight minutes play forty times faster, about twelve seconds.
    expect(took / 1000).toBeGreaterThan(9);
    expect(took / 1000).toBeLessThan(15);
    expect(phases.map(({ phase }) => phase)).toEqual(["entry", "supersonic", "powered"]);
    expect(landed).toHaveLength(1);
    expect(landed[0].speed).toBeLessThan(1.5);
    // The landing's points, and the little the run scores for time flown meanwhile.
    expect(simulation.state.score - score).toBeGreaterThanOrEqual(defaults.scoring.landing);
    expect(simulation.state.score - score).toBeLessThan(defaults.scoring.landing + 5);
    expect(simulation.snapshot.descent).toBeNull();

    partsOf(simulation).ship.angle = Math.atan2(partsOf(simulation).ship.landedOffset?.y ?? -1, partsOf(simulation).ship.landedOffset?.x ?? 0);
    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(simulation.state.descent).toBeNull();
  });

  test("a descent never plays longer than the config allows, and in real time plays at life's pace", () => {
    const fast = createFlying();

    touchDown(fast, "moon");
    expect(untilDown(fast) / 1000).toBeLessThanOrEqual(defaults.descent.longest + 0.5);

    const real = createFlying();

    real.setLanding({ time: "real", control: "auto" });
    touchDown(real, "moon");
    real.step(2000);
    expect(real.snapshot.descent?.pace).toBe(1);
    expect(real.state.descent?.craft.time).toBeCloseTo(2, 0);
  });

  test("flown by hand, the pilot takes the burn at the low gate; never burning, the legs give way and the hull pays", () => {
    const simulation = createFlying();
    const hard = heard(simulation, "hardLanding");
    const landed = heard(simulation, "landed");

    simulation.setLanding({ time: "compressed", control: "manual" });
    touchDown(simulation, "moon");

    while (!simulation.state.descent?.craft.isPilot) {
      simulation.step(100);
    }

    expect(simulation.snapshot.descent).toEqual(expect.objectContaining({ phase: "pilot", isPilot: true, canFly: true, pace: 1 }));

    const before = partsOf(simulation).health.hull + partsOf(simulation).health.shields;

    untilDown(simulation);

    expect(landed).toHaveLength(0);
    expect(hard).toHaveLength(1);
    expect(hard[0].speed).toBeGreaterThan(hard[0].safe);
    expect(partsOf(simulation).health.hull + partsOf(simulation).health.shields).toBeLessThan(before);
    expect(simulation.state.landings.has("moon")).toBe(false);
  });

  test("a pilot holding the fall to a crawl touches down in one piece", () => {
    const simulation = createFlying();
    const landed = heard(simulation, "landed");

    simulation.setLanding({ time: "compressed", control: "manual" });
    touchDown(simulation, "moon");
    // The last 150 m at life's pace, holding the fall near 2.5 m/s.
    untilDown(simulation, (run) => {
      const craft = run.state.descent?.craft;

      return { ...NO_INPUT, thrust: craft?.isPilot && -craft.up > 2.5 ? 1 : 0 };
    }, 120000);

    expect(landed).toHaveLength(1);
    expect(landed[0].speed).toBeLessThan(3);
  });

  test("home over the sea the capsule splashes down without its landing rockets; the crew is picked up, and days later a new rocket waits on the pad", () => {
    const simulation = createFlying();
    const phases = heard(simulation, "descending");
    const recovered = heard(simulation, "recovered");

    touchDown(simulation, "earth");
    simulation.setGround("earth", true);
    untilDown(simulation);

    expect(phases.map(({ phase }) => phase)).toEqual(["entry", "drogue", "main"]);
    expect(simulation.snapshot.homecoming).toEqual({ stage: "recovery", days: defaults.descent.recoveryDays, isSea: true });
    expect(recovered).toHaveLength(0);

    // Nothing to launch from the sea.
    partsOf(simulation).ship.angle = Math.atan2(partsOf(simulation).ship.landedOffset?.y ?? -1, partsOf(simulation).ship.landedOffset?.x ?? 0);
    simulation.step(1000, BURN);
    expect(partsOf(simulation).ship.landedOn).toBe("earth");

    const epoch = simulation.state.clock.epochMs;

    partsOf(simulation).ship.fuel = 1;
    simulation.step(defaults.descent.recoverySeconds * 1000);

    expect(recovered).toEqual([{ body: "earth", days: defaults.descent.recoveryDays }]);
    expect(simulation.state.clock.epochMs - epoch).toBe(defaults.descent.recoveryDays * 86400000);
    expect(simulation.snapshot.homecoming?.stage).toBe("pad");
    expect(partsOf(simulation).ship.fuel).toBe(partsOf(simulation).ship.maxFuel);

    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(simulation.state.homecoming).toBeNull();
  });

  test("a way down ends at once if the ship is no longer on the world", () => {
    const simulation = createFlying();

    touchDown(simulation, "moon");
    expect(simulation.state.descent).not.toBeNull();

    // Thrown clear of it, as an impact or a black hole would.
    const { body, ship } = partsOf(simulation);

    ship.landedOn = null;
    ship.landedOffset = null;
    Object.assign(body, { x: body.x + 5, prevX: body.x + 5 });
    simulation.step(defaults.stepMs);
    expect(simulation.state.descent).toBeNull();
  });
});

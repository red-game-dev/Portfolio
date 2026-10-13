import { NO_INPUT, VoyageEvents, VoyageSimulation } from "@/packages/games/voyage";
import { angleBetween } from "@/packages/math/angles";

import { createFlying, defaults, EPOCH, partsOf, touchDown, untilDown } from "./fixtures/simulation";

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

    // A burn held through touchdown waits for the ship to settle on its legs; after that, it lifts off.
    partsOf(simulation).ship.angle = Math.atan2(partsOf(simulation).ship.landedOffset?.y ?? -1, partsOf(simulation).ship.landedOffset?.x ?? 0);
    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBe("mars");
    simulation.step(defaults.descent.settleSeconds * 1000);
    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(simulation.state.descent).toBeNull();
  });

  test("a new run climbs clear of Earth with no hand on the controls, rather than falling straight back in", () => {
    const simulation = createFlying();
    const earth = () => simulation.state.system.bodies.find((place) => place.id === "earth");
    const height = () => {
      const { body } = partsOf(simulation);
      const home = earth();

      return home ? Math.hypot(body.x - home.x, body.y - home.y) - home.radius : 0;
    };

    expect(simulation.state.liftoff?.body).toBe("earth");
    simulation.step(10000);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(height()).toBeGreaterThan((earth()?.radius ?? 1) * 3);
  });

  test("a short burn on the ground lifts off straight up and climbs clear, rather than falling straight back", () => {
    const simulation = createFlying();

    touchDown(simulation, "mars");
    untilDown(simulation);
    simulation.step(defaults.descent.settleSeconds * 1000);

    const mars = simulation.state.system.bodies.find((place) => place.id === "mars");
    const height = () => {
      const { body } = partsOf(simulation);

      return mars ? Math.hypot(body.x - mars.x, body.y - mars.y) - mars.radius : 0;
    };

    // A tap's worth of burn, then hands off: no aiming, no holding.
    simulation.step(100, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(simulation.state.liftoff?.body).toBe("mars");

    simulation.step(defaults.flight.liftoffSeconds * 1000);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
    expect(height()).toBeGreaterThan(mars ? mars.radius : 1);
    // The window over, the world pulls in full again.
    simulation.step(500);
    expect(simulation.state.liftoff).toBeNull();
  });

  test("a run that starts with the Moon overhead climbs past it, never into it", () => {
    const placeOf = (simulation: VoyageSimulation, id: string) => {
      const place = simulation.state.system.bodies.find((body) => body.id === id);

      if (!place) {
        throw new Error(`no ${id} in the system`);
      }

      return place;
    };
    // The start, every six hours over a month, nearest to the Moon standing straight over the pad.
    const [overhead] = Array.from({ length: 120 }, (_, index) => EPOCH + index * 6 * 3600 * 1000).map((epochMs) => {
      const simulation = createFlying({}, 7, epochMs);
      const earth = placeOf(simulation, "earth");
      const moon = placeOf(simulation, "moon");

      return { epochMs, off: Math.abs(angleBetween(-Math.PI / 2, Math.atan2(moon.y - earth.y, moon.x - earth.x))) };
    })
.sort((a, b) => a.off - b.off);

    expect(overhead.off).toBeLessThan(0.15);

    const simulation = createFlying({}, 7, overhead.epochMs);
    let hits = 0;
    let touched = false;

    simulation.events.on("hit", () => {
      hits += 1;
    });

    for (let elapsed = 0; elapsed < 8000; elapsed += 100) {
      simulation.step(100);
      touched = touched || partsOf(simulation).ship.landedOn !== null || simulation.state.descent !== null;
    }

    expect(touched).toBe(false);
    expect(hits).toBe(0);
  });

  test("the shortest burn on a giant's moon climbs clear from any side on any day, the giant's pull eased with the moon's", () => {
    const cases = Array.from({ length: 12 }, (_, day) => EPOCH + day * 2.5 * 24 * 3600 * 1000).flatMap((epochMs) =>
      ["io", "europa", "ganymede"].flatMap((id) => [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((side) => ({ epochMs, id, side }))));

    cases.forEach(({ epochMs, id, side }) => {
      const simulation = createFlying({}, 7, epochMs);
      const place = simulation.state.system.bodies.find((body) => body.id === id);

      if (!place) {
        throw new Error(`no ${id} in the system`);
      }

      const { body } = partsOf(simulation);
      const contact = place.radius + body.radius * 0.9;
      const x = place.x + Math.cos(side) * contact;
      const y = place.y + Math.sin(side) * contact;

      Object.assign(body, { x, y, prevX: x, prevY: y, vx: place.vx, vy: place.vy });
      simulation.step(defaults.stepMs * 2);
      untilDown(simulation);
      simulation.step(defaults.descent.settleSeconds * 1000);
      // One step's burn, then hands off.
      simulation.step(defaults.stepMs, BURN);
      simulation.step(defaults.flight.liftoffSeconds * 1000);

      const after = partsOf(simulation).body;

      expect({ id, side, landedOn: partsOf(simulation).ship.landedOn }).toEqual({ id, side, landedOn: null });
      expect(Math.hypot(after.x - place.x, after.y - place.y) - place.radius).toBeGreaterThan(place.radius);
    });
  }, 60000);

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

  test("coming down through Venus's air, the hull feels the pressure at the craft's height: none high up, crushing only near the ground", () => {
    const simulation = createFlying();
    const rating = defaults.thermal.pressureBar;
    const sound = () => partsOf(simulation).health.hull + partsOf(simulation).health.shields;

    touchDown(simulation, "venus");

    const before = sound();
    let deepest = 0;

    // High in the air the pressure is a sliver of the ground's, and nothing presses on the hull.
    simulation.step(500);
    expect(simulation.state.descent?.craft.altitude).toBeGreaterThan(30000);
    expect(simulation.state.readings.pressureBar).toBeLessThan(1);
    expect(sound()).toBe(before);

    while (simulation.state.descent?.downAt === null) {
      simulation.step(100);
      deepest = Math.max(deepest, simulation.state.readings.pressureBar);
    }

    // At the ground it is 92 bar, past what the hull is built for, and the hull pays for the last of the way.
    expect(deepest).toBeGreaterThan(rating);
    expect(sound()).toBeLessThan(before);
  });

  test("a Rocket stranded on Venus, its tank boiled dry and its engines wrecked, is rescued home: 146 days later a new rocket waits on the pad", () => {
    const simulation = createFlying();
    const stranded = heard(simulation, "stranded");
    const rescued = heard(simulation, "rescued");

    touchDown(simulation, "venus");
    untilDown(simulation);

    const epoch = simulation.state.clock.epochMs;

    // Burning does nothing with no fuel, and the crush cannot take the hull below its floor: without a rescue it
    // would stay there for ever.
    simulation.step(1000, BURN);
    expect(partsOf(simulation).ship.landedOn).toBe("venus");
    expect(stranded).toEqual([{ body: "venus", seconds: defaults.descent.strandedSeconds, isRescue: true, isOver: false }]);
    expect(simulation.snapshot.stranded?.isRescue).toBe(true);
    expect(simulation.snapshot.stranded?.secondsLeft).toBeGreaterThanOrEqual(defaults.descent.strandedSeconds - 1);

    simulation.step(defaults.descent.strandedSeconds * 1000);

    // Half a transfer orbit from Venus's 0.72 AU to Earth's.
    expect(rescued).toHaveLength(1);
    expect(rescued[0].from).toBe("venus");
    expect(rescued[0].days).toBeGreaterThanOrEqual(144);
    expect(rescued[0].days).toBeLessThanOrEqual(148);
    expect(simulation.state.clock.epochMs - epoch).toBe(rescued[0].days * 86400000);
    expect(partsOf(simulation).ship.landedOn).toBe("earth");
    expect(partsOf(simulation).ship.fuel).toBe(partsOf(simulation).ship.maxFuel);
    expect(partsOf(simulation).health.hull).toBe(partsOf(simulation).health.maxHull);
    expect(simulation.state.homecoming?.stage).toBe("pad");
    expect(simulation.state.stranded).toBeNull();

    // The new rocket launches as after any homecoming.
    partsOf(simulation).ship.angle = Math.atan2(partsOf(simulation).ship.landedOffset?.y ?? 1, partsOf(simulation).ship.landedOffset?.x ?? 0);
    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("a burn held through the rescue waits to be let go on the pad, and the new rocket does not point at the Sun", () => {
    const simulation = createFlying();
    const tookOff = heard(simulation, "tookOff");

    touchDown(simulation, "venus");
    untilDown(simulation);
    simulation.step((defaults.descent.strandedSeconds + 2) * 1000, BURN);

    expect(partsOf(simulation).ship.landedOn).toBe("earth");
    expect(tookOff).toHaveLength(0);

    const { star } = simulation.state.system;
    const earth = simulation.state.system.bodies.find((body) => body.id === "earth");
    const sunward = Math.atan2(star.y - (earth?.y ?? 0), star.x - (earth?.x ?? 0));
    const off = Math.abs(Math.atan2(Math.sin(partsOf(simulation).ship.angle - sunward), Math.cos(partsOf(simulation).ship.angle - sunward)));

    expect(off).toBeGreaterThan(Math.PI / 4);

    // Let go, then burn: it launches.
    simulation.step(200);
    simulation.step(300, BURN);
    expect(partsOf(simulation).ship.landedOn).toBeNull();
  });

  test("stranded on the Moon, the rescue takes the fewest days, not a transfer orbit's months", () => {
    const simulation = createFlying();
    const rescued = heard(simulation, "rescued");

    touchDown(simulation, "moon");
    untilDown(simulation);
    partsOf(simulation).ship.fuel = 0;
    simulation.step((defaults.descent.strandedSeconds + 1) * 1000);

    expect(rescued).toEqual([{ from: "moon", days: defaults.descent.rescueFewestDays }]);
  });

  test("adrift with no fuel out by the Moon's distance from Earth, the rescue still takes the fewest days", () => {
    // A short wait, so the rescue comes before a ship without fuel drifts down to Earth.
    const simulation = createFlying({ descent: { ...defaults.descent, strandedSeconds: 3 } });
    const rescued = heard(simulation, "rescued");
    const moon = simulation.state.system.bodies.find((body) => body.id === "moon");
    const earth = simulation.state.system.bodies.find((place) => place.id === "earth");

    if (!moon || !earth || moon.orbit.kind !== "moon") {
      throw new Error("expected Earth and the Moon");
    }

    const { body } = partsOf(simulation);
    // Opposite the Moon, a little further out than its far side, circling Earth so it stays adrift.
    const away = Math.atan2(earth.y - moon.y, earth.x - moon.x);
    const out = 1.3 * (moon.orbit.distance + moon.radius);
    const x = earth.x + Math.cos(away) * out;
    const y = earth.y + Math.sin(away) * out;
    const circling = Math.sqrt(earth.mu / out);

    Object.assign(body, {
      x, y, prevX: x, prevY: y, vx: earth.vx - Math.sin(away) * circling, vy: earth.vy + Math.cos(away) * circling,
    });
    partsOf(simulation).ship.fuel = 0;
    simulation.step(4000);

    expect(rescued).toEqual([{ from: null, days: defaults.descent.rescueFewestDays }]);
  });

  test("fuel loaded in time ends being stranded", () => {
    const simulation = createFlying();

    partsOf(simulation).ship.fuel = 0;
    simulation.step(1000);
    expect(simulation.state.stranded).not.toBeNull();
    partsOf(simulation).ship.fuel = 20;
    simulation.step(100);
    expect(simulation.state.stranded).toBeNull();
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

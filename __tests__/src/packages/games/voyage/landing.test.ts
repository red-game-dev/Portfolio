import {
  advanceDescent,
  airFromSurface,
  DescentState,
  flyAhead,
  isSoftTouchdown,
  LANDING,
  LandingPhase,
  LandingWorld,
  planLanding,
  rehearse,
  startDescent,
} from "@/packages/games/voyage/landing";

const world = (gravity: number, radiusKm: number, air: LandingWorld["air"], isHome = false, isWater = false): LandingWorld => ({
  gravity, radius: radiusKm * 1000, air, isHome, isWater,
});

// Our worlds from their measured surface air (bar, Celsius, kg/mol).
const EARTH = world(9.81, 6371, airFromSurface(1.013, 15, 0.02897, 9.81), true);
const MARS = world(3.71, 3389.5, airFromSurface(0.006, -63, 0.04334, 3.71));
const MOON = world(1.62, 1737.4, null);
const TITAN = world(1.352, 2574.7, airFromSurface(1.45, -179, 0.0276, 1.352));
const VENUS = world(8.87, 6051.8, airFromSurface(92, 464, 0.04345, 8.87));
const PLUTO = world(0.62, 1188.3, airFromSurface(0.00001, -229, 0.028, 0.62));

interface Flight {
  state: DescentState;
  phases: Array<{ phase: LandingPhase; time: number; altitude: number }>;
  peakLoad: number;
  peakHeating: number;
  // The most height gained in a step under the landing rockets.
  climbed: number;
}

// The whole way down, a quarter second at a time, with a pilot's hand on the throttle where given.
const fly = (on: LandingWorld, pilot?: (state: DescentState) => number): Flight => {
  const plan = planLanding(on);
  const state = startDescent(plan);
  const phases = [{ phase: state.phase, time: 0, altitude: state.altitude }];
  let peakLoad = 0;
  let peakHeating = 0;
  let climbed = 0;

  while (!state.isDown && state.time < 30000) {
    const before = state.altitude;

    advanceDescent(state, on, plan, 0.25, { isManual: Boolean(pilot), throttle: pilot ? pilot(state) : 0 });
    peakLoad = Math.max(peakLoad, state.load);
    peakHeating = Math.max(peakHeating, state.heating);
    climbed = state.phase === "softLanding" ? Math.max(climbed, state.altitude - before) : climbed;

    if (state.phase !== phases[phases.length - 1].phase) {
      phases.push({ phase: state.phase, time: state.time, altitude: state.altitude });
    }
  }

  return { state, phases, peakLoad, peakHeating, climbed };
};

const at = (flight: Flight, phase: LandingPhase) => flight.phases.find((entry) => entry.phase === phase);

describe("games/voyage/landing", () => {
  test("air from what is measured at the ground: density, scale height and the speed of sound", () => {
    expect(EARTH.air?.density).toBeCloseTo(1.225, 2);
    expect(EARTH.air?.scaleHeight).toBeGreaterThan(8000);
    expect(EARTH.air?.scaleHeight).toBeLessThan(8800);
    expect(EARTH.air?.soundSpeed).toBeCloseTo(340, -1);
    expect(MARS.air?.density).toBeCloseTo(0.015, 3);
    expect(TITAN.air?.density).toBeGreaterThan(5);
    expect(VENUS.air?.density).toBeGreaterThan(60);
  });

  test("each world gets its real way down, chosen from its own air and gravity", () => {
    expect(planLanding(EARTH).method).toBe("parachutes");
    expect(planLanding(MARS).method).toBe("chuteAndBurn");
    expect(planLanding(MOON).method).toBe("powered");
    expect(planLanding(PLUTO).method).toBe("powered");
    expect(planLanding(TITAN).method).toBe("probe");
    expect(planLanding(VENUS).method).toBe("dragPlate");
    // A world a universe made: Earth-like air under a heavier pull still comes down on parachutes; thick cold air
    // under a light one, on parachutes all the way.
    expect(planLanding(world(12, 7000, airFromSurface(1.5, 20, 0.029, 12))).method).toBe("parachutes");
    expect(planLanding(world(2, 3000, airFromSurface(3, -150, 0.028, 2))).method).toBe("probe");
  });

  test("home from orbit: entry near 4 g with lift, drogues at 5.5 km, mains at 1.8 km, the soft landing rockets at the last moment", () => {
    const flight = fly(EARTH);

    expect(flight.phases.map((entry) => entry.phase)).toEqual(["entry", "drogue", "main", "softLanding", "down"]);
    expect(flight.peakLoad).toBeGreaterThan(3);
    expect(flight.peakLoad).toBeLessThan(5);
    expect(flight.peakHeating).toBeCloseTo(1, 0);
    expect(at(flight, "drogue")?.altitude).toBeCloseTo(5500, -3);
    expect(at(flight, "main")?.altitude).toBeCloseTo(1800, -3);
    // Three to six minutes under the mains, as a capsule spends.
    expect((at(flight, "softLanding")?.time ?? 0) - (at(flight, "main")?.time ?? 0)).toBeGreaterThan(180);
    expect((at(flight, "softLanding")?.time ?? 0) - (at(flight, "main")?.time ?? 0)).toBeLessThan(360);
    expect(flight.state.impactSpeed).toBeLessThan(planLanding(EARTH).safeSpeed);
    // The landing rockets brake to the touchdown speed just at the ground, never kicking the capsule back up.
    expect(flight.climbed).toBe(0);
  });

  test("at sea the capsule fires nothing and splashes down under its mains", () => {
    const sea = { ...EARTH, isWater: true };
    const flight = fly(sea);

    expect(at(flight, "softLanding")).toBeUndefined();
    expect(flight.state.impactSpeed).toBeCloseTo(6.7, 0);
    expect(isSoftTouchdown(flight.state, planLanding(sea), sea)).toBe(true);
    expect(isSoftTouchdown(flight.state, planLanding(EARTH), EARTH)).toBe(false);
  });

  test("Mars: seven or eight minutes from entry, the supersonic parachute near Mach 1.9, the engine from 2 km to a gentle touchdown", () => {
    const flight = fly(MARS);

    expect(flight.phases.map((entry) => entry.phase)).toEqual(["entry", "supersonic", "powered", "down"]);
    expect(flight.state.time).toBeGreaterThan(360);
    expect(flight.state.time).toBeLessThan(540);
    expect(at(flight, "powered")?.altitude).toBeLessThanOrEqual(2100);
    expect(flight.state.impactSpeed).toBeLessThan(1.5);
  });

  test("the Moon: a powered descent of about twelve minutes from 15 km at orbital speed, down at about 1 m/s", () => {
    const flight = fly(MOON);

    expect(flight.state.time).toBeGreaterThan(600);
    expect(flight.state.time).toBeLessThan(840);
    expect(flight.state.impactSpeed).toBeLessThan(1.5);
  });

  test("Titan: parachutes all the way, about two and a half hours to the ground at 4.5 m/s", () => {
    const flight = fly(TITAN);

    expect(flight.phases.map((entry) => entry.phase)).toEqual(["entry", "drogue", "main", "down"]);
    expect(flight.state.time / 3600).toBeGreaterThan(2.2);
    expect(flight.state.time / 3600).toBeLessThan(3);
    expect(flight.state.impactSpeed).toBeCloseTo(4.5, 1);
  });

  test("Venus: the parachute let go high up, then about an hour on the drag plate to land at 7.5 m/s", () => {
    const flight = fly(VENUS);
    const plate = at(flight, "dragPlate");

    expect(flight.phases.map((entry) => entry.phase)).toEqual(["entry", "main", "dragPlate", "down"]);
    expect((flight.state.time - (plate?.time ?? 0)) / 60).toBeGreaterThan(45);
    expect((flight.state.time - (plate?.time ?? 0)) / 60).toBeLessThan(70);
    expect(flight.state.impactSpeed).toBeCloseTo(7.5, 1);
  });

  test("flown by hand, the pilot takes over at the low gate, slow and upright", () => {
    const plan = planLanding(MOON);
    const state = startDescent(plan);

    while (!state.isPilot && !state.isDown) {
      advanceDescent(state, MOON, plan, 0.25, { isManual: true, throttle: 0 });
    }

    expect(state.phase).toBe("pilot");
    expect(state.altitude).toBeLessThanOrEqual(150);
    expect(state.altitude).toBeGreaterThan(140);
    expect(-state.up).toBeLessThan(7);
    expect(Math.abs(state.across)).toBeLessThan(2);
    expect(rehearse(MOON, plan, true)).toBeLessThan(rehearse(MOON, plan));
  });

  test("a pilot who never burns hits hard; one who flies it holds the fall and touches down gently", () => {
    const dropped = fly(MOON, () => 0);
    // Burn to hold the fall near 1.5 m/s: more throttle the faster it falls.
    const flown = fly(MOON, (state) => (state.isPilot ? Math.min(1, Math.max(0, 0.5 + (-state.up - 1.5) * 0.3)) : 0));

    expect(dropped.state.impactSpeed).toBeGreaterThan(planLanding(MOON).safeSpeed);
    expect(flown.state.impactSpeed).toBeLessThan(planLanding(MOON).safeSpeed);
    expect(flown.state.reserve).toBeLessThan(90);
  });

  test("the engine stops when the pilot's reserve runs out", () => {
    const plan = planLanding(MOON);
    const state = startDescent(plan);

    while (!state.isPilot) {
      advanceDescent(state, MOON, plan, 0.25, { isManual: true, throttle: 0 });
    }

    // Burning hard the whole time climbs, until the reserve is gone and the engine with it.
    for (let second = 0; second < 100; second += 0.25) {
      advanceDescent(state, MOON, plan, 0.25, { isManual: true, throttle: 1 });
    }

    expect(state.reserve).toBe(0);
    expect(state.throttle).toBe(0);
    expect(state.isDown).toBe(false);
  });

  test("rehearsing is the descent the guidance flies", () => {
    const flight = fly(MARS);

    expect(rehearse(MARS, planLanding(MARS))).toBeCloseTo(flight.state.time, -1);
  });

  test("rehearsing for a pilot stops where they take over, at the low gate", () => {
    const plan = planLanding(MARS);
    const state = flyAhead(MARS, plan, true);

    expect(state.isPilot).toBe(true);
    expect(state.altitude).toBeLessThanOrEqual(LANDING.powered.gate.altitude);
    expect(state.altitude).toBeGreaterThan(LANDING.powered.gate.altitude - 20);
    expect(rehearse(MARS, plan, true)).toBeLessThan(rehearse(MARS, plan));
  });

  test("where no parachute could open in time, the heat shield and then the engine, lit high enough to stop the fall", () => {
    const heavy = world(30, 4000, airFromSurface(0.3, -180, 0.028, 30));
    const plan = planLanding(heavy);
    const flight = fly(heavy);

    expect(plan.method).toBe("retroBurn");
    expect(flight.phases.map((entry) => entry.phase)).toEqual(["entry", "powered", "down"]);
    expect(isSoftTouchdown(flight.state, plan, heavy)).toBe(true);
  });

  test("where the air is too thin and shallow to slow the craft in time, the engine from above it", () => {
    const cold = world(3.7, 6000, airFromSurface(0.0012, -220, 0.028, 3.7));
    const plan = planLanding(cold);

    expect(plan.method).toBe("powered");
    expect(plan.startAltitude).toBeGreaterThan(LANDING.powered.startAltitude);
    expect(isSoftTouchdown(fly(cold).state, plan, cold)).toBe(true);
  });

  test("every way down is flown ahead before it is taken, so the guidance lands in one piece on any air a world can have", () => {
    const missed: string[] = [];

    [0.004, 0.05, 0.5, 3, 30, 100].forEach((bar) => [-200, -60, 460].forEach((celsius) => [0.028, 0.044].forEach((molar) => [1, 9.8, 20].forEach((gravity) => {
      const on = world(gravity, 5000, airFromSurface(bar, celsius, molar, gravity));
      const plan = planLanding(on);
      const state = flyAhead(on, plan);

      if (!isSoftTouchdown(state, plan, on)) {
        missed.push(`${plan.method} at ${bar} bar, ${celsius} C, ${molar} kg/mol, ${gravity} m/s^2: ${state.impactSpeed.toFixed(1)} m/s`);
      }
    }))));

    expect(missed).toEqual([]);
  }, 20000);
});

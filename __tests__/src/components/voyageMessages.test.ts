import { voyageMessage, voyageNotice, voyagePlace } from "@/components/Finale/Voyage/messages";
import { formatClock, formatDistance, telemetryRows } from "@/components/Finale/Voyage/telemetry";
import { portfolioData } from "@/data/resume";
import { MODULE_IDS, SOLAR_SYSTEM, VoyageSnapshot } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const universes = ["The Matrix", "AI", "Chain", "Casino", "Game world"];
const at = (snapshot: Partial<VoyageSnapshot> = {}, au = 1): VoyageSnapshot => ({
  status: "flying",
  phase: "solar",
  universe: -1,
  universes: 0,
  universeName: null,
  hull: 1000,
  maxHull: 1000,
  shields: 400,
  maxShields: 400,
  fuel: 100,
  maxFuel: 100,
  score: 0,
  passing: null,
  landedOn: null,
  surface: null,
  descent: null,
  modules: { hull: 1, engines: 1, shields: 1, sensors: 1, fuel: 1, radiators: 1 },
  waypoint: null,
  target: null,
  boss: null,
  autoFire: true,
  incoming: null,
  level: 0,
  faults: [],
  salvage: null,
  telemetry: {
    gravity: 0.12,
    dominant: null,
    altitudeKm: null,
    speedKmS: 17.3,
    au,
    toHoleAu: null,
    pressureBar: null,
    hullTemperatureC: 20,
    outsideC: 5,
    sunlight: 1361,
    radiation: 65,
    timeDilation: 1,
    missionTime: Date.parse("2026-10-09T12:00:00Z"),
  },
  ...snapshot,
});

describe("the voyage's messages", () => {
  test("every body, belt and place the compass can point to has a name, and so does every system", () => {
    const ids = [SOLAR_SYSTEM.star.id, ...SOLAR_SYSTEM.bodies.map((body) => body.id), ...SOLAR_SYSTEM.belts.map((belt) => belt.id), "edge", "singularity", "hole"];

    expect(ids.filter((id) => !voyage.stops[id])).toEqual([]);
    expect(MODULE_IDS.filter((id) => !voyage.systems.names[id])).toEqual([]);
  });

  test("each stop is said once as it comes up, and nothing is said while nothing changes", () => {
    const moon = at({ passing: "moon" });

    expect(voyageMessage(voyage, moon, at(), universes)).toBe("Passing the Moon");
    expect(voyageMessage(voyage, moon, moon, universes)).toBeNull();
    expect(voyageMessage(voyage, at({ passing: "jupiter" }, 5), moon, universes)).toBe("Passing Jupiter");
  });

  test("the black hole, being lost in it, and where the ship comes out", () => {
    const pluto = at({ passing: "pluto" }, 39.5);
    const singularity = at({ phase: "singularity", passing: "pluto" });
    const lost = at({ phase: "lost", passing: "pluto" });

    expect(voyageMessage(voyage, singularity, pluto, universes)).toBe(voyage.singularity);
    expect(voyageMessage(voyage, lost, singularity, universes)).toBe(voyage.lost);
    expect(voyageMessage(voyage, at({ phase: "universe", universe: 0, universes: 1 }), lost, universes)).toBe("You wake up in The Matrix");
    expect(voyageMessage(voyage, at({ phase: "universe", universe: 3, universes: 2 }), at({ phase: "lost", universe: 0, universes: 1 }), universes))
      .toBe("Thrown into Casino");
  });

  test("landings, lift offs, emergency burns and the moment a black hole takes the ship are said with the body's name", () => {
    expect(voyageNotice(voyage, { kind: "landed", body: "mars", speed: null })).toBe("Landed on Mars");
    expect(voyageNotice(voyage, { kind: "landed", body: "mars", speed: 0.78 })).toBe("Landed on Mars at 0.8 m/s");
    expect(voyageNotice(voyage, { kind: "descent", body: "mars", phase: "supersonic" })).toBe("Supersonic parachute open");
    expect(voyageNotice(voyage, { kind: "descent", body: "mars", phase: "down" })).toBeNull();
    expect(voyageNotice(voyage, { kind: "hardLanding", body: "moon", speed: 9.42, safe: 3 }))
      .toBe("Down on the Moon at 9.4 m/s, more than the 3 m/s it can take: the legs gave way");
    expect(voyageNotice(voyage, { kind: "emergency", body: "jupiter" })).toContain("Jupiter");
    expect(voyageNotice(voyage, { kind: "captured", isSingularity: true })).toBe(voyage.captured);
    expect(voyageNotice(voyage, { kind: "destroyed" })).toBeNull();
  });

  test("flares, storms, failing systems and a melting hull are said as they happen", () => {
    expect(voyageNotice(voyage, { kind: "flare", flareClass: "X", isHeading: true })).toContain("class X");
    expect(voyageNotice(voyage, { kind: "flare", flareClass: "C", isHeading: false })).toBe("Solar flare, class C");
    expect(voyageNotice(voyage, { kind: "storm" })).toBe(voyage.storm);
    expect(voyageNotice(voyage, { kind: "failing", module: "sensors", isGone: false })).toBe("Sensors failing");
    expect(voyageNotice(voyage, { kind: "failing", module: "engines", isGone: true })).toBe("Engines lost");
    expect(voyageNotice(voyage, { kind: "melting", temperatureC: 641.4 })).toContain("641");
  });

  test("rocks headed for worlds, what they do, the boss and the strange things are said as they happen", () => {
    expect(voyageNotice(voyage, { kind: "impactAlert", target: "mars", diameterKm: 3.24, seconds: 21.6 }))
      .toBe("Impact alert: a 3.2 km rock will hit Mars in 22 seconds");
    expect(voyageNotice(voyage, { kind: "impact", target: "moon", outcome: "crater", craterKm: 48.3 })).toBe("the Moon was hit: a crater 48 km across");
    expect(voyageNotice(voyage, { kind: "impact", target: "Veldara II", outcome: "shattered", craterKm: 0 })).toContain("Veldara II is gone");
    expect(voyageNotice(voyage, { kind: "deflected", target: "earth" })).toBe("Pushed off course: it will miss Earth");
    expect(voyageNotice(voyage, { kind: "boss", name: "Thalix Swarm", isFallen: true })).toBe("Thalix Swarm's leader falls");
    expect(voyageNotice(voyage, { kind: "supernova", seconds: 14.6, isBlown: false })).toContain("15 seconds");
    expect(voyageNotice(voyage, { kind: "burst", seconds: 0, isFired: true })).toBe(voyage.burst);
    expect(voyageNotice(voyage, { kind: "heard" })).toBe(voyage.heard);
  });

  test("a universe past the zones is called by its own name", () => {
    expect(voyagePlace(voyage, at({ phase: "universe", universe: 7, universes: 8, universeName: "Veldara Reach" }), universes)).toBe("Universe 8: Veldara Reach");
  });

  test("the top of the screen gives the distance on the way out, then the universe and how many so far", () => {
    expect(voyagePlace(voyage, at({}, 5.2), universes)).toBe("5.2 AU from the Sun");
    expect(voyagePlace(voyage, at({ phase: "universe", universe: 1, universes: 3 }), universes)).toBe("Universe 3: AI");
    expect(voyagePlace(voyage, at({ phase: "lost" }), universes)).toBe(voyage.lost);
  });
});

describe("the voyage's telemetry", () => {
  test("shows only what is worth reading now, in real units", () => {
    const deepSpace = telemetryRows(voyage, at()).map((row) => row.label);
    const nearJupiter = telemetryRows(voyage, at({
      telemetry: { ...at().telemetry, gravity: 24.79, dominant: "jupiter", altitudeKm: 3200, speedKmS: 21, au: 5.2, pressureBar: 0.4, hullTemperatureC: 640 },
      waypoint: { id: "saturn", name: null, distanceKm: 652000000 },
    }));

    expect(deepSpace).not.toContain(voyage.telemetry.altitude);
    expect(deepSpace).not.toContain(voyage.telemetry.dilation);
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.gravity)?.value).toBe("24.79 m/s², Jupiter");
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.altitude)?.value).toBe("3,200 km");
    expect(nearJupiter.find((row) => row.label === voyage.telemetry.next)?.value).toBe("Saturn, 652.0 million km");
  });

  test("clocks slowing by a black hole show as a factor", () => {
    const rows = telemetryRows(voyage, at({ telemetry: { ...at().telemetry, timeDilation: 2.4 } }));

    expect(rows.find((row) => row.label === voyage.telemetry.dilation)?.value).toBe("×2.40");
  });

  test("with the sensors gone, what they measure reads no signal; the clock and the hull's temperature still read", () => {
    const rows = telemetryRows(voyage, at({ modules: { ...at().modules, sensors: 0.1 } }));

    expect(rows.find((row) => row.label === voyage.telemetry.gravity)?.value).toBe(voyage.telemetry.noSignal);
    expect(rows.find((row) => row.label === voyage.telemetry.temperature)?.value).toBe("20 °C");
    expect(rows.find((row) => row.label === voyage.telemetry.clock)?.value).toBe("9 Oct 2026, 12:00 UTC");
  });

  test("the mission clock reads as a date and time in UTC", () => {
    expect(formatClock(voyage, Date.parse("2026-12-24T23:05:00Z"))).toBe("24 Dec 2026, 23:05 UTC");
  });

  test("distances read in millions of km once they are that far", () => {
    expect(formatDistance(voyage, 1500000)).toBe("1.5 million km");
    expect(formatDistance(voyage, 42000)).toBe("42,000 km");
  });
});

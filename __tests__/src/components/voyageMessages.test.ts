import { voyageMessage, voyageNotice, voyagePlace } from "@/components/Finale/Voyage/messages";
import { formatDistance, telemetryRows } from "@/components/Finale/Voyage/telemetry";
import { portfolioData } from "@/data/resume";
import { SOLAR_SYSTEM, VoyageSnapshot } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const universes = ["The Matrix", "AI", "Chain", "Casino", "Game world"];
const at = (snapshot: Partial<VoyageSnapshot> = {}, au = 1): VoyageSnapshot => ({
  status: "flying",
  phase: "solar",
  universe: -1,
  universes: 0,
  hull: 1000,
  maxHull: 1000,
  shields: 400,
  maxShields: 400,
  fuel: 100,
  maxFuel: 100,
  score: 0,
  passing: null,
  landedOn: null,
  waypoint: null,
  telemetry: { gravity: 0.12, dominant: null, altitudeKm: null, speedKmS: 17.3, au, pressureBar: null, hullTemperatureC: 20, timeDilation: 1 },
  ...snapshot,
});

describe("the voyage's messages", () => {
  test("every stop on the way out, and both kinds of black hole, has a name", () => {
    const ids = [...SOLAR_SYSTEM.bodies.map((body) => body.id), ...SOLAR_SYSTEM.belts.map((belt) => belt.id), "singularity", "hole"];

    expect(ids.filter((id) => !voyage.stops[id])).toEqual([]);
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
    expect(voyageNotice(voyage, { kind: "landed", body: "mars" })).toBe("Landed on Mars");
    expect(voyageNotice(voyage, { kind: "emergency", body: "jupiter" })).toContain("Jupiter");
    expect(voyageNotice(voyage, { kind: "captured", isSingularity: true })).toBe(voyage.captured);
    expect(voyageNotice(voyage, { kind: "destroyed" })).toBeNull();
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
      telemetry: { gravity: 24.79, dominant: "jupiter", altitudeKm: 3200, speedKmS: 21, au: 5.2, pressureBar: 0.4, hullTemperatureC: 640, timeDilation: 1 },
      waypoint: { id: "saturn", distanceKm: 652000000 },
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

  test("distances read in millions of km once they are that far", () => {
    expect(formatDistance(voyage, 1500000)).toBe("1.5 million km");
    expect(formatDistance(voyage, 42000)).toBe("42,000 km");
  });
});

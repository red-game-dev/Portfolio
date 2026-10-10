import { airFor, earthGround, groundAt, phaseOf, skyPlace, solarHours } from "@/packages/games/voyage";

const QUARTER = Math.PI / 2;

describe("standing on a world", () => {
  test("things stand overhead when straight up, on the horizon a quarter turn off, and below it beyond", () => {
    expect(skyPlace(0, 0)).toEqual({ elevation: 90, side: 0 });
    expect(skyPlace(0, QUARTER).elevation).toBeCloseTo(0, 6);
    expect(skyPlace(0, QUARTER).side).toBeCloseTo(0.9, 6);
    expect(skyPlace(0, -QUARTER).side).toBeCloseTo(-0.9, 6);
    expect(skyPlace(0, Math.PI).elevation).toBeCloseTo(-90, 6);
  });

  test("local time is noon with the star overhead, and six hours either way with it on a horizon", () => {
    expect(solarHours(1, 1)).toBeCloseTo(12, 6);
    expect(solarHours(0, QUARTER)).toBeCloseTo(18, 6);
    expect(solarHours(0, -QUARTER)).toBeCloseTo(6, 6);
    expect(solarHours(0, Math.PI)).toBeCloseTo(0, 6);
  });

  test("something in the sky is full opposite the star and new beside it", () => {
    expect(phaseOf(Math.PI, 0).lit).toBeCloseTo(1, 6);
    expect(phaseOf(0, 0).lit).toBeCloseTo(0, 6);
    expect(phaseOf(0, QUARTER).lightSide).toBe(1);
  });

  test("Earth's ground is read from the colour of its map where the ship sets down", () => {
    expect(earthGround([20, 60, 120], 10)).toMatchObject({ biome: "ocean", relief: "sea" });
    expect(earthGround([240, 245, 250], 80)).toMatchObject({ biome: "ice" });
    expect(earthGround([210, 170, 120], 23)).toMatchObject({ biome: "desert", relief: "dunes" });
    expect(earthGround([30, 70, 30], 0)).toMatchObject({ biome: "forest" });
    expect(earthGround([110, 140, 80], 45)).toMatchObject({ biome: "grassland" });
    expect(earthGround([120, 110, 105], 30)).toMatchObject({ biome: "rock" });
    expect(earthGround(null, 75)).toMatchObject({ biome: "ice" });
  });

  test("other worlds have their own ground: Mars's ice caps and dust, Titan's methane seas, a made world's from its recipe", () => {
    expect(groundAt("mars", undefined, null, 82, 0, true)).toMatchObject({ biome: "ice" });
    expect(groundAt("mars", undefined, [180, 90, 50], 10, 40, true)).toMatchObject({ biome: "dust", colour: "#b45a32" });
    expect(groundAt("titan", undefined, null, 70, 0, true)).toMatchObject({ biome: "methaneSea", relief: "sea" });
    expect(groundAt("moon", undefined, null, 0, 0, true)).toMatchObject({ biome: "regolith", relief: "craters" });

    const lava = { surface: { kind: "lava" as const, palette: ["#200000", "#ff4400", "#ff8800", "#ffcc00"] as [string, string, string, string], seed: 1 } };

    expect(groundAt("veldara-ii", lava, null, 0, 0, false)).toMatchObject({ biome: "lava", colour: "#ff4400" });
  });

  test("skies: ours as they look, none on airless worlds, a made world's thicker and hazier with more air", () => {
    expect(airFor("earth", undefined, 1, true)?.strength).toBe(1);
    expect(airFor("moon", undefined, null, true)).toBeNull();
    expect(airFor("veldara-ii", undefined, 0.001, false)).toBeNull();
    expect(airFor("veldara-ii", undefined, 50, false)?.haze).toBeGreaterThan(0.8);
    expect(airFor("veldara-ii", undefined, 0.05, false)?.strength).toBeLessThan(airFor("veldara-ii", undefined, 5, false)?.strength ?? 0);
  });
});

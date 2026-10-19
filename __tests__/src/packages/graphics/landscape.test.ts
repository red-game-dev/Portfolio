import { Air, Frame, LandscapePainter, ridgeline, Scene, SkyBody, skyLight, sunColour } from "@/packages/graphics/landscape";

import { FakeContext2D } from "../../fixtures/canvas";

const EARTH: Air = { zenith: "#3b7bd0", horizon: "#b5d5f2", dusk: "#ff8d4d", night: "#0b1631", strength: 1, haze: 0 };
const brightness = ([red, green, blue]: [number, number, number]) => red + green + blue;

describe("graphics/landscape", () => {
  test("Earth's sky by day is blue and hides the stars; at night it is dark and shows them; at dusk the horizon glows", () => {
    const day = skyLight(EARTH, 40);
    const night = skyLight(EARTH, -30);
    const dusk = skyLight(EARTH, 1);

    expect(day.zenith[2]).toBeGreaterThan(day.zenith[0]);
    expect(day.stars).toBeLessThan(0.05);
    expect(day.light).toBe(1);
    expect(night.stars).toBeGreaterThan(0.9);
    expect(night.light).toBeLessThan(0.2);
    expect(brightness(night.zenith)).toBeLessThan(brightness(day.zenith) / 3);
    expect(dusk.glowStrength).toBeGreaterThan(0.8);
    expect(dusk.horizon[0]).toBeGreaterThan(dusk.horizon[2]);
  });

  test("climbing out of the air turns the day sky black and lets the stars through", () => {
    const ground = skyLight(EARTH, 40, 1);
    const high = skyLight(EARTH, 40, 0.02);

    expect(brightness(high.zenith)).toBeLessThan(brightness(ground.zenith) / 4);
    expect(high.stars).toBeGreaterThan(0.5);
  });

  test("with no air the sky is black and starry, the ground lit only while the sun is up", () => {
    expect(skyLight(null, 30)).toMatchObject({ stars: 1, light: 1, glowStrength: 0 });
    expect(skyLight(null, -5).light).toBeLessThan(0.1);
  });

  test("thick haze hides the stars even at night, and the sun reddens near the horizon only through air", () => {
    expect(skyLight({ ...EARTH, haze: 1 }, -40).stars).toBeLessThan(0.05);
    expect(sunColour("#ffffff", EARTH, 1)[2]).toBeLessThan(150);
    expect(sunColour("#ffffff", null, 1)).toEqual([255, 255, 255]);
  });

  test("a line of land is the same for the same seed, different for another, within 0 to 1, and ridged land has crests", () => {
    const line = ridgeline("hills", 4, 0, 50);

    expect(Array.from(line)).toEqual(Array.from(ridgeline("hills", 4, 0, 50)));
    expect(Array.from(line)).not.toEqual(Array.from(ridgeline("hills", 5, 0, 50)));
    expect(Math.min(...line)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...line)).toBeLessThanOrEqual(1);
    expect(Math.max(...ridgeline("mountains", 4, 0, 50))).toBeGreaterThan(0.8);
  });

  test("a body its host can draw as it really looks is left to the host; one it cannot is drawn as a lit disc", () => {
    const arcs: number[] = [];
    const context = Object.assign(new FakeContext2D(), {
      arc: (x: number) => {
        arcs.push(x);
      },
    });
    const frame: Frame = { context, width: 800, height: 600, horizon: 400, fieldOfView: 70, drop: 0, density: 1, now: 0 };
    const body = (side: number, paint?: SkyBody["paint"]): SkyBody => ({
      elevation: 20, side, radius: 1, colour: "#3060c0", lit: 0.5, lightSide: 1, hasRings: false, paint,
    });
    const painted: Array<[number, number, number]> = [];
    const scene: Scene = {
      air: null,
      sun: null,
      bodies: [body(-0.5, (x, y, radius) => painted.push([x, y, radius]) > 0), body(0.5, () => false)],
      ground: { colour: "#777777", far: "#555555", relief: "flat", hasRocks: false, seed: 1 },
    };

    new LandscapePainter(1).paintBodies(frame, scene);
    expect(painted).toHaveLength(1);
    expect(painted[0][2]).toBeCloseTo(600 / 70);
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toBeGreaterThan(painted[0][0]);
    expect(context.globalAlpha).toBe(1);
  });
});

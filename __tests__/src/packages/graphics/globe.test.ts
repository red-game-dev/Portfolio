import { blackbody, globeFrame, GlobePose, northUp, surfacePoint, visibleRegion } from "@/packages/graphics/globe";

const DEG = Math.PI / 180;

const pose = (overrides: Partial<GlobePose> = {}): GlobePose => ({
  lightAngle: 0,
  subsolarLatitude: 0,
  subsolarLongitude: 0,
  viewElevation: 20,
  isTurned: false,
  ...overrides,
});

describe("graphics/globe", () => {
  test.each([
    [{ subsolarLongitude: 40, subsolarLatitude: 10 }],
    [{ subsolarLongitude: -120, subsolarLatitude: -23, isTurned: true }],
    [{ subsolarLongitude: 175, subsolarLatitude: 60, viewElevation: 35 }],
  ])("the point under the light is the subsolar point, however the globe is posed (%o)", (overrides) => {
    const frame = globeFrame(pose(overrides));
    const point = surfacePoint(frame, frame.light);
    const longitude = ((point.longitude / DEG + 540) % 360) - 180;

    expect(point.latitude / DEG).toBeCloseTo(overrides.subsolarLatitude, 6);
    expect(longitude).toBeCloseTo(overrides.subsolarLongitude, 6);
  });

  test("the light points along the screen towards its source, or away when the globe is turned to keep north up", () => {
    expect(globeFrame(pose()).light[0]).toBeGreaterThan(0);
    expect(globeFrame(pose({ isTurned: true })).light[0]).toBeLessThan(0);
    expect(globeFrame(pose({ lightAngle: 1, isTurned: true })).angle).toBeCloseTo(1 + Math.PI, 10);
  });

  test("a globe turns to keep north up once its light is well to the left, and holds its answer in between", () => {
    expect(northUp(Math.PI, false)).toBe(true);
    expect(northUp(0, true)).toBe(false);
    expect(northUp(Math.PI / 2, true)).toBe(true);
    expect(northUp(Math.PI / 2, false)).toBe(false);
  });

  test("a body that keeps one face to another shows it longitude 0 towards it", () => {
    const facingEast = globeFrame(pose({ facing: 0 }));
    const facingWest = globeFrame(pose({ facing: Math.PI }));

    // Longitude 0 at the limb towards the light, then at the opposite limb.
    expect(surfacePoint(facingEast, [1, 0, 0]).longitude).toBeCloseTo(0, 6);
    expect(surfacePoint(facingWest, [-1, 0, 0]).longitude).toBeCloseTo(0, 6);
  });

  test("only the part of a globe on screen is drawn, at the target's pixel ratio unless it would not fit", () => {
    expect(visibleRegion(-200, 100, 50, 800, 600, 2, 1600, 1200)).toBeNull();
    expect(visibleRegion(10, 100, 50, 800, 600, 2, 1600, 1200)).toEqual({ x: 0, y: 50, width: 60, height: 100, pixelWidth: 120, pixelHeight: 200, pixelRatio: 2 });

    const huge = visibleRegion(400, 300, 5000, 800, 600, 2, 800, 600);

    expect(huge?.pixelRatio).toBe(1);
    expect(huge?.pixelWidth).toBe(800);
  });

  test("starlight is red for a cool star, near white for the Sun, blue for a hot one", () => {
    const [redR, , redB] = blackbody(3000);
    const sun = blackbody(5772);
    const [hotR, , hotB] = blackbody(20000);

    expect(redR).toBeGreaterThan(redB * 2);
    expect(Math.min(...sun)).toBeGreaterThan(0.85);
    expect(hotB).toBeGreaterThan(hotR);
  });
});

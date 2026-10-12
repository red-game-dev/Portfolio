/**
 * @jest-environment node
 */
import { airFromSurface, forecastKey, forecastLanding, LandingForecasts, planLanding, rehearse } from "@/packages/games/voyage/landing";
import type { LandingWorld } from "@/packages/games/voyage/landing";

const world = (gravity: number, radiusKm: number, air: LandingWorld["air"]): LandingWorld => ({ gravity, radius: radiusKm * 1000, air, isHome: false, isWater: false });

const MARS = world(3.71, 3389.5, airFromSurface(0.006, -63, 0.04334, 3.71));
const MOON = world(1.62, 1737.4, null);

describe("landings worked out ahead", () => {
  test("give the same plan and timings a landing works out for itself", () => {
    const ahead = forecastLanding(MARS);
    const plan = planLanding(MARS);

    expect(ahead.plan).toEqual(plan);
    expect(ahead.auto).toBeCloseTo(rehearse(MARS, plan), 6);
    expect(ahead.manual).toBeCloseTo(rehearse(MARS, plan, true), 6);
  });

  test("survive being copied to and from a worker", () => {
    const ahead = forecastLanding(MOON);

    expect(structuredClone(ahead)).toEqual(ahead);
  });

  test("answer only for the world they were worked out for, and stay for a second landing", () => {
    const forecasts = new LandingForecasts();
    const ahead = forecastLanding(MOON);

    forecasts.put(forecastKey(MOON), ahead);

    expect(forecasts.has(forecastKey(MOON))).toBe(true);
    expect(forecasts.take(MOON)).toBe(ahead);
    expect(forecasts.take(MOON)).toBe(ahead);
    expect(forecasts.take(MARS)).toBeNull();
    expect(forecasts.take({ ...MOON, isWater: true })).toBeNull();
  });
});

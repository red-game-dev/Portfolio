import { LandingPlan, LandingWorld } from "../domain/landing";
import { rehearse } from "./descent";
import { planLanding } from "./plan";

// A world's way down worked out ahead: the plan it calls for, and how long the guidance takes to fly it, alone to the
// ground and to a pilot's low gate. Pure, so a host can work it out away from the frame (in a worker) and hand it in
// before the landing begins; the same function the landing calls itself, so the answer is the same either way.
export interface LandingForecast {
  plan: LandingPlan;
  auto: number;
  manual: number;
}

export const forecastLanding = (world: LandingWorld): LandingForecast => {
  const plan = planLanding(world);

  return { plan, auto: rehearse(world, plan), manual: rehearse(world, plan, true) };
};

// The key a forecast is kept under: the world it was worked out for, whole, so a forecast never answers for another.
export const forecastKey = (world: LandingWorld): string => JSON.stringify(world);

// Landings worked out ahead, kept by the world they belong to. A landing takes what is ready and works out the rest
// itself; a world landed on twice finds its forecast still there.
export class LandingForecasts {
  private readonly ready = new Map<string, LandingForecast>();

  public put(key: string, forecast: LandingForecast): void {
    this.ready.set(key, forecast);
  }

  public has(key: string): boolean {
    return this.ready.has(key);
  }

  public take(world: LandingWorld): LandingForecast | null {
    return this.ready.get(forecastKey(world)) ?? null;
  }
}

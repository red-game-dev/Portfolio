import { forecastLanding } from "@/packages/games/voyage";
import type { LandingWorld } from "@/packages/games/voyage";

// Works each world's way down out away from the page, so a landing on an older phone does not stall the frame it
// begins in: the same function the landing would call itself.
const scope = self as unknown as Worker;

scope.addEventListener("message", (event: MessageEvent<{ key: string; world: LandingWorld }>) => {
  const { key, world } = event.data;

  scope.postMessage({ key, forecast: forecastLanding(world) });
});

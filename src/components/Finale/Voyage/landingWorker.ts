import type { LandingForecast, LandingForecaster } from "@/packages/games/voyage";

// The voyage's landing worker, where the browser has workers: it answers each world asked about with its forecast.
// Without workers, or if one cannot start, there is none, and each landing works its own way down out as it begins.
export const createLandingForecaster = (): LandingForecaster | null => {
  if (typeof Worker === "undefined") {
    return null;
  }

  try {
    const worker = new Worker(new URL("./workers/landing.worker.ts", import.meta.url));
    let handler: ((key: string, forecast: LandingForecast) => void) | null = null;

    worker.addEventListener("message", (event: MessageEvent<{ key: string; forecast: LandingForecast }>) => handler?.(event.data.key, event.data.forecast));

    return {
      request: (key, world) => worker.postMessage({ key, world }),
      onForecast: (next) => {
        handler = next;
      },
      dispose: () => worker.terminate(),
    };
  } catch {
    return null;
  }
};

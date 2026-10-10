import { Vibrator } from "../domain/types";

// The browser's navigator, which holds the vibration motor where there is one; none on the server.
export const navigatorVibrator = (): Vibrator | null => (typeof navigator === "undefined" ? null : navigator);

// Milliseconds on the page's clock, or the wall clock where it has none.
export const pageClock = (): number => (typeof performance === "undefined" ? Date.now() : performance.now());

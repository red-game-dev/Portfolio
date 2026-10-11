import { DEFAULT_HAPTIC_GAP_MS } from "../config/patterns";
import { HapticPattern, HapticsOptions, Vibrator } from "../domain/types";
import { navigatorVibrator, pageClock } from "../sources/navigator";

// Whether a pattern asks for no buzz at all, which the Vibration API reads as stopping one.
const isSilent = (pattern: HapticPattern) => (typeof pattern === "number" ? !(pattern > 0) : pattern.length === 0);

// Buzzes the device through the Vibration API where it has one. A buzz is dropped, never queued, while haptics are
// off, before the reader has used the page (Chrome refuses one then and says so in the console), and within the
// least gap of the last buzz, so rapid hits do not run into one long buzz. A missing API, or one that throws, is
// the same as a device without a motor: nothing happens and nothing breaks.
export class Haptics {
  private readonly device: () => Vibrator | null;
  private readonly now: () => number;
  private gapMs: number;
  private isOn: boolean;
  private lastAt: number | null = null;

  constructor(options: HapticsOptions = {}) {
    this.device = options.device ?? navigatorVibrator;
    this.now = options.now ?? pageClock;
    this.gapMs = Math.max(0, options.minGapMs ?? DEFAULT_HAPTIC_GAP_MS);
    this.isOn = options.isEnabled ?? true;
  }

  public get isEnabled(): boolean {
    return this.isOn;
  }

  // Whether the device can buzz at all, so a host can leave out a switch that would do nothing.
  public get isSupported(): boolean {
    return typeof this.device()?.vibrate === "function";
  }

  // Turns haptics on or off. Turning them off stops a buzz already playing.
  public setEnabled(isEnabled: boolean): void {
    this.isOn = isEnabled;

    if (!isEnabled) {
      this.stop();
    }
  }

  public setMinGap(ms: number): void {
    this.gapMs = Math.max(0, ms);
  }

  // Buzzes `pattern`. Returns whether the device took it.
  public vibrate(pattern: HapticPattern): boolean {
    const device = this.device();

    if (!this.isOn || isSilent(pattern) || typeof device?.vibrate !== "function" || device.userActivation?.hasBeenActive === false) {
      return false;
    }

    const now = this.now();

    if (this.lastAt !== null && now - this.lastAt < this.gapMs) {
      return false;
    }

    try {
      const isTaken = device.vibrate(pattern) !== false;

      if (isTaken) {
        this.lastAt = now;
      }

      return isTaken;
    } catch {
      return false;
    }
  }

  // Stops any buzz playing, whether or not haptics are on.
  public stop(): void {
    try {
      this.device()?.vibrate?.(0);
    } catch {
      // A device that cannot stop was not buzzing.
    }
  }
}

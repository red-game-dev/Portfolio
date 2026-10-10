import { Haptics } from "../core/Haptics";
import { HapticPattern } from "../domain/types";

// One set of haptics for the whole page, so the switch and the gap between buzzes hold wherever a buzz is asked
// for. It reads the navigator only when it buzzes, so it is safe to load during server rendering.
const shared = new Haptics();

// Buzzes `pattern` (one of HAPTIC_PATTERNS or the host's own). Returns whether the device took it.
export const vibrate = (pattern: HapticPattern): boolean => shared.vibrate(pattern);

// Turns every buzz on the page on or off; off also stops one already playing.
export const setHapticsEnabled = (isEnabled: boolean): void => shared.setEnabled(isEnabled);

export const isHapticsEnabled = (): boolean => shared.isEnabled;

// The least time in ms from one buzz to the next.
export const setHapticsGap = (ms: number): void => shared.setMinGap(ms);

// Whether this device can buzz at all.
export const canVibrate = (): boolean => shared.isSupported;

export const stopHaptics = (): void => shared.stop();

export { Haptics } from "./core/Haptics";
export { DEFAULT_HAPTIC_GAP_MS, HAPTIC_PATTERNS } from "./config/patterns";
export { canVibrate, isHapticsEnabled, setHapticsEnabled, setHapticsGap, stopHaptics, vibrate } from "./services/haptics";
export { navigatorVibrator } from "./sources/navigator";
export type { HapticName, HapticPattern, HapticsOptions, Vibrator } from "./domain/types";

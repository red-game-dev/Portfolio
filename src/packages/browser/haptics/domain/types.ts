// A vibration as the Vibration API takes it: one buzz of so many ms, or buzzes and pauses in turn.
export type HapticPattern = number | readonly number[];

// The moments a game buzzes for.
export type HapticName = "tap" | "hit" | "bigHit" | "pickup" | "levelUp" | "warning" | "explosion";

// What haptics reads from the device. The browser's navigator fits, and so does a plain object in a test. Either
// part can be missing: Safari has no vibrate, and only some browsers say whether the reader has used the page yet.
export interface Vibrator {
  userActivation?: { hasBeenActive: boolean };
  vibrate?(pattern: HapticPattern): boolean;
}

export interface HapticsOptions {
  // Where the vibration motor is found: the browser's navigator by default, none on the server.
  device?: () => Vibrator | null;
  // A clock in ms, for the gap between buzzes.
  now?: () => number;
  // The least time from one buzz to the next. Anything asked for sooner is dropped, so a stream of hits does not
  // become one long buzz.
  minGapMs?: number;
  isEnabled?: boolean;
}

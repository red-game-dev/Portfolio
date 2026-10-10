import type { Schema } from "@/packages/settings/preferences";

// The preferences a reader can set, kept in their browser and changed from the hangar's Settings or the terminal
// (`settings`, `set`, `reset`). A new one is added here, with its words in the content (`preferences.items`), and
// read where it applies through `usePreferencesStateHook`.
export const SITE_PREFERENCES = {
  // How long a landing takes: sped up the same for every world (true to how long each takes against the others),
  // or as long as the real thing.
  "landing-time": { kind: "choice", options: ["compressed", "real"], initial: "compressed" },
  // Who flies the landing burn: the guidance, as a real landing is flown, or the pilot.
  "landing-control": { kind: "choice", options: ["auto", "manual"], initial: "auto" },
  // How much the space round the ship slows it: felt, in the real order (voids emptiest, rings and nebulae
  // densest), or strictly real, where space is too empty to slow a ship at all.
  "space-drag": { kind: "choice", options: ["felt", "real"], initial: "felt" },
  // On a phone or tablet, steering by tilting it: off until the reader turns it on.
  "tilt-steering": { kind: "toggle", initial: false },
  // How the guns aim: by themselves (spending more ammunition), or by hand, as a twin stick game aims.
  "voyage-aim": { kind: "choice", options: ["auto", "manual"], initial: "auto" },
  // How hard the voyage is: on hard, the main gun falls silent when its rounds run out.
  "voyage-difficulty": { kind: "choice", options: ["normal", "hard"], initial: "normal" },
  // How loud the voyage's sounds and its music are.
  "voyage-sound": { kind: "choice", options: ["off", "low", "medium", "high"], initial: "medium" },
  "voyage-music": { kind: "choice", options: ["off", "low", "medium", "high"], initial: "low" },
  // A buzz on hits and finds, on a phone that can.
  "voyage-haptics": { kind: "toggle", initial: true },
} as const satisfies Schema;

export type SitePreferences = typeof SITE_PREFERENCES;

export type PreferenceName = keyof SitePreferences;

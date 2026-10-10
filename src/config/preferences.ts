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
} as const satisfies Schema;

export type SitePreferences = typeof SITE_PREFERENCES;

export type PreferenceName = keyof SitePreferences;

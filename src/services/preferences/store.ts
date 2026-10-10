import { SITE_PREFERENCES } from "@/config/preferences";
import { readStored, writeStored } from "@/packages/browser/storage";
import { PreferenceStore } from "@/packages/settings/preferences";

export const PREFERENCES_KEY = "redgame.preferences";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

// The reader's preferences, one store for the whole site: the page reads it through its provider, the terminal
// changes it directly, and both hear every change. Nothing is read from the browser until `load`, after mount.
export const preferences = new PreferenceStore(SITE_PREFERENCES, {
  read: () => readStored(PREFERENCES_KEY, isRecord),
  write: (values) => {
    writeStored(PREFERENCES_KEY, values);
  },
});

import type { PreferenceName } from "@/config/preferences";

// A preference as a reader sees it: its name, what it does, and what each of its options is called.
export interface PreferenceCopy {
  name: string;
  description: string;
  options: Record<string, string>;
}

// What the terminal says about settings ("{key}", "{name}", "{value}" and "{options}" are filled in).
export interface PreferencesTerminalCopy {
  settingsSummary: string;
  setSummary: string;
  resetSummary: string;
  listTitle: string;
  row: string;
  changed: string;
  unknown: string;
  invalid: string;
  usage: string;
  resetAll: string;
  resetOne: string;
}

export interface PreferencesContent {
  title: string;
  note: string;
  items: Record<PreferenceName, PreferenceCopy>;
  terminal: PreferencesTerminalCopy;
}

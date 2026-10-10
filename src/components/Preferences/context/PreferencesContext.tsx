import { createContext, ReactNode, useEffect, useMemo, useState } from "react";

import { PreferenceName, SitePreferences } from "@/config/preferences";
import type { Values } from "@/packages/settings/preferences";
import { preferences } from "@/services/preferences/store";

export interface PreferencesState {
  values: Values<SitePreferences>;
  // Returns whether the value was one of the setting's.
  set: (name: PreferenceName, value: string | boolean) => boolean;
  reset: (name?: PreferenceName) => void;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesContext = createContext<PreferencesState | null>(null);

// The reader's preferences for the page: the defaults on the server and the first render, then what this browser
// kept, and every change after, from the Settings or from the terminal.
export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const [values, setValues] = useState(preferences.values);

  useEffect(() => {
    const stop = preferences.subscribe(setValues);

    preferences.load();
    setValues(preferences.values);

    return stop;
  }, []);

  const value = useMemo<PreferencesState>(() => ({
    values,
    set: (name, next) => preferences.set(name, next),
    reset: (name) => preferences.reset(name),
  }), [values]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

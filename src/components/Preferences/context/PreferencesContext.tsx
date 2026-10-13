import { createContext, ReactNode, useEffect, useMemo, useState } from "react";

import { PreferenceName, SitePreferences } from "@/config/preferences";
import { isMotionReduced, MOTION_ATTRIBUTE } from "@/packages/accessibility/motion";
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

  // The root's data-motion, which every rule about motion reads: from the kept setting (read from the store, loaded by
  // the effect above, so the first pass already has it) and the device's setting, as either changes. The document's
  // head set it before the first paint from the same two.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => document.documentElement.setAttribute(MOTION_ATTRIBUTE, isMotionReduced(preferences.values.motion, media.matches) ? "reduced" : "full");

    apply();
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, [values.motion]);

  const value = useMemo<PreferencesState>(() => ({
    values,
    set: (name, next) => preferences.set(name, next),
    reset: (name) => preferences.reset(name),
  }), [values]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

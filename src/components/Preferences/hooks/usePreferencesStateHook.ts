import { useContext } from "react";

import { PreferencesContext, PreferencesState } from "@/components/Preferences/context/PreferencesContext";

export const usePreferencesStateHook = (): PreferencesState => {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferencesStateHook must be used inside a PreferencesProvider");
  }

  return context;
};

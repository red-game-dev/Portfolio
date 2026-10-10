import { useCallback, useEffect, useState } from "react";

import { askToTilt, canTilt } from "@/components/Finale/Voyage/tilt";
import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { PreferenceName } from "@/config/preferences";

const VOYAGE_SETTINGS: readonly PreferenceName[] = ["landing-time", "landing-control", "space-drag", "tilt-steering"];

// The settings the voyage offers, steering by tilting only on a device that can, read after mount so the server and
// the first render agree; and what picking one does beyond keeping it: turning tilting on asks the browser first,
// and turns it back off if the browser says no.
export const useVoyageSettings = (): { names: readonly PreferenceName[]; onPick: (name: PreferenceName, value: string | boolean) => void } => {
  const { set } = usePreferencesStateHook();
  const [isTiltable, setTiltable] = useState(false);

  useEffect(() => setTiltable(canTilt()), []);

  const onPick = useCallback((name: PreferenceName, value: string | boolean) => {
    if (name === "tilt-steering" && value === true) {
      void askToTilt().then((isAllowed) => {
        if (!isAllowed) {
          set(name, false);
        }
      });
    }
  }, [set]);

  return { names: isTiltable ? VOYAGE_SETTINGS : VOYAGE_SETTINGS.filter((name) => name !== "tilt-steering"), onPick };
};

import { useCallback, useEffect, useState } from "react";

import { askToTilt, canTilt } from "@/components/Finale/Voyage/tilt";
import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { PreferenceName } from "@/config/preferences";
import { canVibrate } from "@/packages/browser/haptics";

const VOYAGE_SETTINGS: readonly PreferenceName[] = [
  "voyage-aim", "voyage-difficulty", "landing-time", "landing-control", "space-drag", "tilt-steering", "voyage-sound", "voyage-music", "voyage-haptics",
];

// What the first flight asks: the few that change how it plays; the rest wait in the hangar's Settings.
const SETUP_SETTINGS: readonly PreferenceName[] = ["voyage-aim", "voyage-difficulty", "tilt-steering", "voyage-sound"];

// The settings the voyage offers (all of them in the hangar, the few that matter most before the first flight),
// steering by tilting and vibration only on a device that can, read after mount so the server and the first render
// agree; and what picking one does beyond keeping it: turning tilting on asks the browser first, and turns it back
// off if the browser says no.
export const useVoyageSettings = (): {
  names: readonly PreferenceName[];
  setupNames: readonly PreferenceName[];
  onPick: (name: PreferenceName, value: string | boolean) => void;
} => {
  const { set } = usePreferencesStateHook();
  const [device, setDevice] = useState({ canTilt: false, canVibrate: false });

  useEffect(() => setDevice({ canTilt: canTilt(), canVibrate: canVibrate() }), []);

  const onPick = useCallback((name: PreferenceName, value: string | boolean) => {
    if (name === "tilt-steering" && value === true) {
      void askToTilt().then((isAllowed) => {
        if (!isAllowed) {
          set(name, false);
        }
      });
    }
  }, [set]);
  const offered = (name: PreferenceName) => (name !== "tilt-steering" || device.canTilt) && (name !== "voyage-haptics" || device.canVibrate);

  return { names: VOYAGE_SETTINGS.filter(offered), setupNames: SETUP_SETTINGS.filter(offered), onPick };
};

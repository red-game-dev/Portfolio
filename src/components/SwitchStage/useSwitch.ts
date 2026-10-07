import { useCallback, useRef, useState } from "react";

import { SwitchEffect, switchEffectFor } from "@/components/SwitchStage/config";
import { zoneOf } from "@/components/SwitchStage/zoneOf";
import { ZoneId } from "@/config/zones";

export interface Switcher {
  ref: React.RefObject<HTMLDivElement>;
  effect: SwitchEffect | null;
  direction: 1 | -1;
  // Bumped on every switch, to key the layers that must play again.
  count: number;
  // A showcase whose content has a universe of its own (a drawing) passes it; otherwise the stage's place
  // in the page decides.
  play: (direction: 1 | -1, zone?: ZoneId) => void;
}

// The state behind a SwitchStage. Nothing plays until the first switch, so content never animates on
// load; each switch then plays the effect of the zone the stage sits in.
const useSwitch = (): Switcher => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<Pick<Switcher, "effect" | "direction" | "count">>({ effect: null, direction: 1, count: 0 });

  const play = useCallback((direction: 1 | -1, zone?: ZoneId) => {
    const effect = switchEffectFor(zone ?? zoneOf(ref.current));

    setState((previous) => ({ effect, direction, count: previous.count + 1 }));
  }, []);

  return { ref, ...state, play };
};

export default useSwitch;

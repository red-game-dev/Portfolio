import { useEffect, useRef } from "react";

import { KeyMap } from "@/packages/interaction/keys";

// Hands every key press anywhere on the page that `map` knows to `onIntent`, handled as the map was set up to, for
// a shortcut that works wherever the reader is. Listens while the component is mounted and `isEnabled` holds (a
// reader can turn single key shortcuts off); the latest `onIntent` is always the one called.
export const useWindowKeys = <I extends NonNullable<unknown>>(map: KeyMap<I>, onIntent: (intent: I) => void, isEnabled = true) => {
  const latest = useRef(onIntent);

  latest.current = onIntent;

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const onKey = (event: KeyboardEvent) => {
      map.handle(event, (intent) => latest.current(intent));
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [isEnabled, map]);
};

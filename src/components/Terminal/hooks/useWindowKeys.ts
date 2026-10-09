import { useEffect, useRef } from "react";

import { KeyMap } from "@/packages/interaction/keys";

// Hands every key press anywhere on the page that `map` knows to `onIntent`, handled as the map was set up to, for
// a shortcut that works wherever the reader is. Listens for as long as the component is mounted; the latest
// `onIntent` is always the one called.
export const useWindowKeys = <I extends NonNullable<unknown>>(map: KeyMap<I>, onIntent: (intent: I) => void) => {
  const latest = useRef(onIntent);

  latest.current = onIntent;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      map.handle(event, (intent) => latest.current(intent));
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [map]);
};

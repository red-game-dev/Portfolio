import { useCallback, useEffect, useState } from "react";

// What the URL hash says, read through `parse` (null when it says nothing this caller understands), and
// followed as it changes. Read after mount, so the server and the first client render both see null.
// `parse` should keep its identity between renders (module level, or useCallback).
export const useHashValue = <T>(parse: (hash: string) => T | null) => {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    const sync = () => setValue(parse(window.location.hash));

    sync();
    window.addEventListener("hashchange", sync);

    return () => window.removeEventListener("hashchange", sync);
  }, [parse]);

  return value;
};

// State kept in the URL hash, so a filtered view can be linked from an application and every section
// reading the same hash follows along. Setting it to null clears the hash.
export default function useHashState<T>(parse: (hash: string) => T | null, anchorOf: (value: T) => string) {
  const value = useHashValue(parse);

  const setValue = useCallback((next: T | null) => {
    window.history.replaceState(null, "", next === null ? window.location.pathname : `#${anchorOf(next)}`);
    // replaceState fires no event, so every reader of the hash, this one included, is told directly.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, [anchorOf]);

  return [value, setValue] as const;
}

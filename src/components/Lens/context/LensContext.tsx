import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_LENS, isLens, Lens, LENS_SETTINGS, LENS_STORAGE_KEY, lensFromSearch, LensSettings } from "@/config/lenses";
import { readStored, writeStored } from "@/packages/browser/storage";

// "pending" until storage and the URL have been read, so the chooser never flashes for a returning reader.
// "entering" while the chosen view's entrance plays over the page.
export type LensStatus = "pending" | "choosing" | "entering" | "chosen";

// Split in two so the sections that only care which view is on do not re-render while the chooser moves
// through its states, which happens right after hydration on a first visit.
export interface LensState {
  lens: Lens;
  settings: LensSettings;
  // From the header: changes the view in place.
  switchLens: (lens: Lens) => void;
}

export interface LensStatusState {
  status: LensStatus;
  // From the chooser: remembers the view and plays its entrance.
  chooseLens: (lens: Lens) => void;
  finishEntrance: () => void;
}

interface LensProviderProps {
  children: ReactNode;
}

export const LensContext = createContext<LensState | null>(null);

export const LensStatusContext = createContext<LensStatusState | null>(null);

// Which reader the page is for. A ?view= link wins, then a remembered choice; otherwise the reader is asked.
// A link does not overwrite the remembered choice, since it was someone else's pick.
export const LensProvider = ({ children }: LensProviderProps) => {
  const [lens, setLens] = useState<Lens>(DEFAULT_LENS);
  const [status, setStatus] = useState<LensStatus>("pending");

  useEffect(() => {
    const chosen = lensFromSearch(window.location.search) ?? readStored(LENS_STORAGE_KEY, isLens);

    if (chosen) {
      setLens(chosen);
      setStatus("chosen");
    } else {
      setStatus("choosing");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.lens = lens;
  }, [lens]);

  const chooseLens = useCallback((next: Lens) => {
    setLens(next);
    setStatus("entering");
    writeStored(LENS_STORAGE_KEY, next);
  }, []);

  const switchLens = useCallback((next: Lens) => {
    setLens(next);
    writeStored(LENS_STORAGE_KEY, next);
  }, []);

  const finishEntrance = useCallback(() => setStatus("chosen"), []);

  const value = useMemo(() => ({ lens, settings: LENS_SETTINGS[lens], switchLens }), [lens, switchLens]);
  const statusValue = useMemo(() => ({ status, chooseLens, finishEntrance }), [status, chooseLens, finishEntrance]);

  return (
    <LensContext.Provider value={value}>
      <LensStatusContext.Provider value={statusValue}>{children}</LensStatusContext.Provider>
    </LensContext.Provider>
  );
};

import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_LENS, isLens, Lens, LENS_QUERY, LENS_SETTINGS, LENS_STORAGE_KEY, LensSettings } from "@/config/lenses";

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

const readStored = (): Lens | null => {
  try {
    const stored = window.localStorage.getItem(LENS_STORAGE_KEY);

    return isLens(stored) ? stored : null;
  } catch {
    return null;
  }
};

const writeStored = (lens: Lens) => {
  try {
    window.localStorage.setItem(LENS_STORAGE_KEY, lens);
  } catch {
    // Not remembering the view only means the chooser shows again next time.
  }
};

export const LensContext = createContext<LensState | null>(null);

export const LensStatusContext = createContext<LensStatusState | null>(null);

// Which reader the page is for. A ?view= link wins, then a remembered choice; otherwise the reader is asked.
// A link does not overwrite the remembered choice, since it was someone else's pick.
export const LensProvider = ({ children }: LensProviderProps) => {
  const [lens, setLens] = useState<Lens>(DEFAULT_LENS);
  const [status, setStatus] = useState<LensStatus>("pending");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(LENS_QUERY);
    const chosen = isLens(fromUrl) ? fromUrl : readStored();

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
    writeStored(next);
  }, []);

  const switchLens = useCallback((next: Lens) => {
    setLens(next);
    writeStored(next);
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

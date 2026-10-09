import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GAME_STORAGE_KEY, isStoredGame } from "@/components/Game/storage";
import { readStored, writeStored } from "@/packages/browser/storage";

export interface GameState {
  characterClass: string | null;
  bestScore: number;
  voyageBest: number;
  // This visit's progress. Not remembered: every visit is a new run.
  defeatedBosses: number;
  zonesVisited: number;
  duelsWon: number;
  selectCharacter: (characterClass: string) => void;
  recordScore: (score: number) => void;
  recordVoyage: (score: number) => void;
  defeatBoss: (boss: string) => void;
  visitZone: (zone: string) => void;
  recordDuels: (won: number) => void;
}

interface GameProviderProps {
  children: ReactNode;
}

export const GameContext = createContext<GameState | null>(null);

export const GameProvider = ({ children }: GameProviderProps) => {
  const [characterClass, setCharacterClass] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [voyageBest, setVoyageBest] = useState(0);
  const [bosses, setBosses] = useState<ReadonlySet<string>>(() => new Set());
  const [zones, setZones] = useState<ReadonlySet<string>>(() => new Set());
  const [duelsWon, setDuelsWon] = useState(0);
  // The first pass holds the defaults, not a choice, so it is never written over what is stored.
  const isFirstPassRef = useRef(true);

  // Read after mount, so the server and the first client render agree.
  useEffect(() => {
    const stored = readStored(GAME_STORAGE_KEY, isStoredGame);

    if (stored) {
      setCharacterClass(stored.characterClass);
      setBestScore(stored.bestScore);
      setVoyageBest(stored.voyageBest ?? 0);
    }
  }, []);

  useEffect(() => {
    if (isFirstPassRef.current) {
      isFirstPassRef.current = false;

      return;
    }

    writeStored(GAME_STORAGE_KEY, { characterClass, bestScore, voyageBest });
  }, [characterClass, bestScore, voyageBest]);

  const recordScore = useCallback((score: number) => setBestScore((current) => Math.max(current, score)), []);

  const recordVoyage = useCallback((score: number) => setVoyageBest((current) => Math.max(current, score)), []);

  const defeatBoss = useCallback((boss: string) => {
    setBosses((current) => (current.has(boss) ? current : new Set(current).add(boss)));
  }, []);

  const visitZone = useCallback((zone: string) => {
    setZones((current) => (current.has(zone) ? current : new Set(current).add(zone)));
  }, []);

  const recordDuels = useCallback((won: number) => setDuelsWon((current) => Math.max(current, won)), []);

  const value = useMemo(
    () => ({
      characterClass,
      bestScore,
      voyageBest,
      defeatedBosses: bosses.size,
      zonesVisited: zones.size,
      duelsWon,
      selectCharacter: setCharacterClass,
      recordScore,
      recordVoyage,
      defeatBoss,
      visitZone,
      recordDuels,
    }),
    [characterClass, bestScore, voyageBest, bosses, zones, duelsWon, recordScore, recordVoyage, defeatBoss, visitZone, recordDuels]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

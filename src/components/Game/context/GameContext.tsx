import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GameState {
  characterClass: string | null;
  bestScore: number;
  // This visit's progress. Not remembered: every visit is a new run.
  defeatedBosses: number;
  zonesVisited: number;
  duelsWon: number;
  selectCharacter: (characterClass: string) => void;
  recordScore: (score: number) => void;
  defeatBoss: (boss: string) => void;
  visitZone: (zone: string) => void;
  recordDuels: (won: number) => void;
}

interface GameProviderProps {
  children: ReactNode;
}

interface StoredGame {
  characterClass: string | null;
  bestScore: number;
}

const STORAGE_KEY = "redgame.game";

const isStoredGame = (value: unknown): value is StoredGame => {
  const candidate = value as Partial<StoredGame> | null;

  return typeof candidate === "object" && candidate !== null &&
    (candidate.characterClass === null || typeof candidate.characterClass === "string") &&
    typeof candidate.bestScore === "number" && Number.isFinite(candidate.bestScore);
};

// Storage can be missing or blocked (private windows, previews), so every read and write is guarded and
// the game simply starts fresh when it fails.
const readStored = (): StoredGame | null => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");

    return isStoredGame(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStored = (value: StoredGame) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Not remembering a character is fine.
  }
};

export const GameContext = createContext<GameState | null>(null);

export const GameProvider = ({ children }: GameProviderProps) => {
  const [characterClass, setCharacterClass] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [bosses, setBosses] = useState<ReadonlySet<string>>(() => new Set());
  const [zones, setZones] = useState<ReadonlySet<string>>(() => new Set());
  const [duelsWon, setDuelsWon] = useState(0);
  // The first pass holds the defaults, not a choice, so it is never written over what is stored.
  const isFirstPassRef = useRef(true);

  // Read after mount, so the server and the first client render agree.
  useEffect(() => {
    const stored = readStored();

    if (stored) {
      setCharacterClass(stored.characterClass);
      setBestScore(stored.bestScore);
    }
  }, []);

  useEffect(() => {
    if (isFirstPassRef.current) {
      isFirstPassRef.current = false;

      return;
    }

    writeStored({ characterClass, bestScore });
  }, [characterClass, bestScore]);

  const recordScore = useCallback((score: number) => setBestScore((current) => Math.max(current, score)), []);

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
      defeatedBosses: bosses.size,
      zonesVisited: zones.size,
      duelsWon,
      selectCharacter: setCharacterClass,
      recordScore,
      defeatBoss,
      visitZone,
      recordDuels,
    }),
    [characterClass, bestScore, bosses, zones, duelsWon, recordScore, defeatBoss, visitZone, recordDuels]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

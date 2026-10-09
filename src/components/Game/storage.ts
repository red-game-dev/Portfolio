// What a visit leaves behind for the next: the character picked, the Bug Raid best and the voyage best.
export interface StoredGame {
  characterClass: string | null;
  bestScore: number;
  // Missing from what was stored before the voyage existed.
  voyageBest?: number;
}

export const GAME_STORAGE_KEY = "redgame.game";

// Anything else under the key (an older shape, a hand edit) is ignored and the game starts fresh.
export const isStoredGame = (value: unknown): value is StoredGame => {
  const candidate = value as Partial<StoredGame> | null;

  return typeof candidate === "object" && candidate !== null &&
    (candidate.characterClass === null || typeof candidate.characterClass === "string") &&
    typeof candidate.bestScore === "number" && Number.isFinite(candidate.bestScore) &&
    (candidate.voyageBest === undefined || (typeof candidate.voyageBest === "number" && Number.isFinite(candidate.voyageBest)));
};

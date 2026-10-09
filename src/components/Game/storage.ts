import { isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

// What a visit leaves behind for the next: the character picked, the Bug Raid best and the voyage best.
export interface StoredGame {
  characterClass: string | null;
  bestScore: number;
  // Missing from what was stored before the voyage existed.
  voyageBest?: number;
}

export const GAME_STORAGE_KEY = "redgame.game";

// Anything else under the key (an older shape, a hand edit) is ignored and the game starts fresh.
export const isStoredGame = (value: unknown): value is StoredGame => isRecord(value) &&
  (value.characterClass === null || isText(value.characterClass)) &&
  isFiniteNumber(value.bestScore) &&
  (value.voyageBest === undefined || isFiniteNumber(value.voyageBest));

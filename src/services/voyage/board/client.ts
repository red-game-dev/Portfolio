import type { BoardEntry, BoardView } from "@/packages/games/daily-board";
import { ApiClient } from "@/packages/http/api-client";

const ENDPOINT = "/api/voyage/board/";

const isEntry = (value: unknown): value is BoardEntry => typeof value === "object" && value !== null && "initials" in value && "score" in value &&
  typeof value.initials === "string" && typeof value.score === "number";

// Whether an answer is a board: a day, its entries, and where a run stands.
const isBoardView = (value: unknown): value is BoardView => typeof value === "object" && value !== null && "day" in value && "entries" in value &&
  typeof value.day === "string" && Array.isArray(value.entries) && value.entries.every(isEntry) &&
  (!("rank" in value) || value.rank === null || typeof value.rank === "number");

// A day's board, or null when the server cannot be reached.
export const fetchBoard = async (day: string): Promise<BoardView | null> => {
  const result = await ApiClient.global().get<unknown>(`${ENDPOINT}?day=${encodeURIComponent(day)}`);

  return result.ok && isBoardView(result.data) ? result.data : null;
};

// A run put on a day's board: the board after, "busy" when too many were put on today, or null when it failed.
export const postRun = async (day: string, initials: string, score: number): Promise<BoardView | "busy" | null> => {
  const result = await ApiClient.global().post<unknown>(ENDPOINT, { day, initials, score });

  if (!result.ok) {
    return result.status === 429 ? "busy" : null;
  }

  return isBoardView(result.data) ? result.data : null;
};

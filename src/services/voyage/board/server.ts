import { createHash, randomBytes } from "crypto";

import { BOARD, boardEntries, boardKey, boardMember, BoardRefusal, BoardView, cleanInitials, isBoardSubmission, submissionProblems } from "@/packages/games/daily-board";
import { KeyValueStore } from "@/packages/server/kv";
import { SlidingWindowLimiter } from "@/packages/server/quota";
import { sharedStore } from "@/services/store/server";

const HOUR = 60 * 60 * 1000;
// A visitor may put a few runs a day on the board, counted an hour at a time, so the scrambled key that counts them
// is forgotten within two hours.
const RATE = { limit: 6, windowMs: HOUR };

// Whoever is putting a run on the board, counted by a salted hash of their address: the store never holds an IP.
const visitorOf = (address: string) => createHash("sha256").update(`${process.env.ASK_SALT ?? "redgame.dev"}:board:${address}`)
  .digest("hex")
  .slice(0, 16);

let parts: { store: KeyValueStore; limiter: SlidingWindowLimiter } | null = null;

const partsOf = () => {
  if (!parts) {
    const store = sharedStore("board");

    parts = { store, limiter: new SlidingWindowLimiter(store, "voyage:board:rate", RATE) };
  }

  return parts;
};

// A day's board, best first.
export const readBoard = async (day: string): Promise<BoardView> => {
  const { store } = partsOf();

  return { day, entries: boardEntries(await store.top(boardKey(day), BOARD.size)), rank: null };
};

// A run put on a day's board, if it is a valid one and the visitor has not put too many on today; the board after,
// with where it stands.
export const submitRun = async (body: unknown, address: string, now = Date.now()): Promise<BoardView | { error: BoardRefusal }> => {
  if (!isBoardSubmission(body) || submissionProblems(body, now).length > 0) {
    return { error: "invalid" };
  }

  const { store, limiter } = partsOf();

  if (!(await limiter.take(visitorOf(address)))) {
    return { error: "busy" };
  }

  const member = boardMember(cleanInitials(body.initials), randomBytes(6).toString("hex"));
  const key = boardKey(body.day);

  await store.rank(key, member, body.score, BOARD.keepMs);

  const ranked = await store.top(key, BOARD.size);
  const place = ranked.findIndex((entry) => entry.member === member);

  return { day: body.day, entries: boardEntries(ranked), rank: place >= 0 ? place + 1 : null };
};

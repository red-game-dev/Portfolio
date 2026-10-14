import { randomBytes } from "crypto";

import { BOARD, boardEntries, boardKey, boardMember, BoardRefusal, BoardView, cleanInitials, isBoardSubmission, submissionProblems } from "@/packages/games/daily-board";
import { KeyValueStore } from "@/packages/server/kv";
import { SlidingWindowLimiter } from "@/packages/server/quota";
import { sharedStore } from "@/services/store/server";
import { visitorOf } from "@/services/store/visitor";

const HOUR = 60 * 60 * 1000;
// A visitor may put a few runs on the board an hour, and everyone together a few hundred, counted an hour at a time,
// so the scrambled key that counts a visitor is forgotten within two hours.
const RATES = { visitor: { limit: 6, windowMs: HOUR }, everyone: { limit: 300, windowMs: HOUR } };

let parts: { store: KeyValueStore; visitor: SlidingWindowLimiter; everyone: SlidingWindowLimiter } | null = null;

const partsOf = () => {
  if (!parts) {
    const store = sharedStore("board");

    parts = {
      store,
      visitor: new SlidingWindowLimiter(store, "voyage:board:rate:visitor", RATES.visitor),
      everyone: new SlidingWindowLimiter(store, "voyage:board:rate:everyone", RATES.everyone),
    };
  }

  return parts;
};

// A day's board, best first.
export const readBoard = async (day: string): Promise<BoardView> => {
  const { store } = partsOf();

  return { day, entries: boardEntries(await store.top(boardKey(day), BOARD.size)), rank: null };
};

// A run put on a day's board, if it is a valid one and neither the visitor nor everyone together has put too many on
// in the hour; the board after, with where it stands. The list keeps only its best hundred.
export const submitRun = async (body: unknown, address: string, now = Date.now()): Promise<BoardView | { error: BoardRefusal }> => {
  if (!isBoardSubmission(body) || submissionProblems(body, now).length > 0) {
    return { error: "invalid" };
  }

  const { store, visitor, everyone } = partsOf();

  if (!(await visitor.take(await visitorOf(store, "voyage:board", address, now))) || !(await everyone.take("all"))) {
    return { error: "busy" };
  }

  const member = boardMember(cleanInitials(body.initials), randomBytes(6).toString("hex"));
  const key = boardKey(body.day);

  await store.rank(key, member, body.score, BOARD.keepMs, BOARD.keep);

  const ranked = await store.top(key, BOARD.size);
  const place = ranked.findIndex((entry) => entry.member === member);

  return { day: body.day, entries: boardEntries(ranked), rank: place >= 0 ? place + 1 : null };
};

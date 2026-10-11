import { createHash, randomBytes } from "crypto";

import { BOARD, boardEntries, boardKey, boardMember, BoardRefusal, BoardView, cleanInitials, isBoardSubmission, submissionProblems } from "@/packages/games/daily-board";
import { KeyValueStore } from "@/packages/server/kv";
import { SlidingWindowLimiter } from "@/packages/server/quota";
import { sharedStore } from "@/services/store/server";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// A visitor may put a few runs on the board an hour, and everyone together a few hundred, counted an hour at a time,
// so the scrambled key that counts a visitor is forgotten within two hours.
const RATES = { visitor: { limit: 6, windowMs: HOUR }, everyone: { limit: 300, windowMs: HOUR } };

// The part of an address that names a connection: an IPv4 address whole, an IPv6 one cut to its /64 (one home or one
// phone holds a whole /64, and could otherwise post from a fresh address each time).
export const networkOf = (address: string): string => {
  if (!address.includes(":") || address.includes(".")) {
    return address;
  }

  const [head, tail] = address.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = address.includes("::") ? [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;

  return `${groups.slice(0, 4).join(":")}::/64`;
};

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

// A random salt kept in the store and made anew each day (no environment secret to forget), so a counted address
// cannot be read back from its hash, and not tied from one day to the next.
const saltFor = async (store: KeyValueStore, now: number): Promise<string> => {
  const key = `voyage:board:salt:${Math.floor(now / DAY)}`;
  const kept = await store.get(key);

  if (kept) {
    return kept;
  }

  await store.set(key, randomBytes(16).toString("hex"), DAY + HOUR);

  return (await store.get(key)) ?? "";
};

// Whoever is putting a run on the board, as a salted hash of their connection: the store never holds an address.
const visitorOf = async (store: KeyValueStore, address: string, now: number) =>
  createHash("sha256").update(`${await saltFor(store, now)}:${networkOf(address)}`)
    .digest("hex")
    .slice(0, 16);

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

  if (!(await visitor.take(await visitorOf(store, address, now))) || !(await everyone.take("all"))) {
    return { error: "busy" };
  }

  const member = boardMember(cleanInitials(body.initials), randomBytes(6).toString("hex"));
  const key = boardKey(body.day);

  await store.rank(key, member, body.score, BOARD.keepMs, BOARD.keep);

  const ranked = await store.top(key, BOARD.size);
  const place = ranked.findIndex((entry) => entry.member === member);

  return { day: body.day, entries: boardEntries(ranked), rank: place >= 0 ? place + 1 : null };
};

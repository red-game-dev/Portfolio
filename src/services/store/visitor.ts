import { createHash, randomBytes } from "crypto";

import { KeyValueStore } from "@/packages/server/kv";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

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

// A random salt kept in the store and made anew each day for each use (no environment secret to forget), so a
// counted address cannot be read back from its hash, and not tied from one day to the next.
const saltFor = async (store: KeyValueStore, scope: string, now: number): Promise<string> => {
  const key = `${scope}:salt:${Math.floor(now / DAY)}`;
  const kept = await store.get(key);

  if (kept) {
    return kept;
  }

  await store.set(key, randomBytes(16).toString("hex"), DAY + HOUR);

  return (await store.get(key)) ?? "";
};

// A visitor, as a salted hash of their connection: the store never holds an address.
export const visitorOf = async (store: KeyValueStore, scope: string, address: string, now: number): Promise<string> =>
  createHash("sha256").update(`${await saltFor(store, scope, now)}:${networkOf(address)}`)
    .digest("hex")
    .slice(0, 16);

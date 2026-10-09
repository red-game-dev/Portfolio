import { hexHash } from "@/packages/encoding/hash";

// A stable, made up block hash from a capability's name: it reads like an explorer without claiming to be
// one, and the server and the browser always agree on it.
export const blockHash = (text: string) => `0x${hexHash(text, 8, 7)}${hexHash(text, 8, 13).slice(0, 4)}`;

export const GENESIS_HASH = "0x000000000000";

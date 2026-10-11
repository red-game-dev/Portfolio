import type { RankedMember } from "@/packages/server/kv";

import { BoardEntry } from "../domain/board";

// Where a day's board is kept, and a run's place on it: its initials and a number made for it, so two pilots with the
// same initials both show.
export const boardKey = (day: string): string => `voyage:board:${day}`;

export const boardMember = (initials: string, nonce: string): string => `${initials}:${nonce}`;

// A board's entries from its ranked members, best first, showing only the initials.
export const boardEntries = (ranked: readonly RankedMember[]): BoardEntry[] => ranked.map(({ member, score }) => ({
  initials: member.split(":")[0] ?? "",
  score: Math.round(score),
}));

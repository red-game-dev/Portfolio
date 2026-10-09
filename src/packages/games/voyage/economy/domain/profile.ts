import type { LedgerSnapshot } from "@/packages/finance/ledger";

import { ItemStack } from "./items";

// What a pilot has done across every run, kept for the records the HUD and the codex show.
export interface PilotRecords {
  runs: number;
  bestScore: number;
  universes: number;
  bosses: number;
  rescues: number;
  salvaged: number;
}

// Everything a pilot keeps between runs, as plain data: the ship's level, what is in the hold, the plans they
// have found, their money as a ledger, and their records.
export interface PilotProfile {
  // When it was written (ms since 1970), so a tab can tell another tab's newer save from its own.
  savedAt: number;
  level: number;
  cargo: ItemStack[];
  blueprints: string[];
  ledger: LedgerSnapshot;
  records: PilotRecords;
}

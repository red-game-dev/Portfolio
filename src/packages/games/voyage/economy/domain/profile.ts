import type { LedgerSnapshot } from "@/packages/finance/ledger";

import { CareerProfile } from "../../career/domain/career";
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

// What the hangar keeps between runs, as plain data: the ship's level, what is in the hold, the plans found, the
// money as a ledger, and the records.
export interface EconomyProfile {
  // When it was written (ms since 1970), so a tab can tell another tab's newer save from its own.
  savedAt: number;
  level: number;
  cargo: ItemStack[];
  blueprints: string[];
  ledger: LedgerSnapshot;
  records: PilotRecords;
}

// Everything a pilot keeps between runs: the hangar's part and the career's.
export interface PilotProfile extends EconomyProfile {
  career: CareerProfile;
}

import type { LedgerSnapshot } from "@/packages/finance/ledger";

import { CareerProfile } from "../../career/domain/career";
import { BoostId } from "../../domain/boosts";
import { ItemStack } from "./items";

// A boost's charges kept between runs, and how many of its cores have been found, which sets its level.
export interface BoostRecord {
  charges: number;
  finds: number;
}

// What a slot of the ability bar holds: a boost, or a consumable from the hold.
export type BarSlot = { kind: "boost"; id: BoostId } | { kind: "item"; id: string };

// A slot as kept in a profile, by name: a boost a later release no longer knows is dropped as the bar is read back,
// rather than the profile being refused.
export interface KeptSlot {
  kind: "boost" | "item";
  id: string;
}

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
  // Each boost found, by name, and what sits in each slot of the ability bar.
  boosts: Record<string, BoostRecord>;
  bar: Array<KeptSlot | null>;
}

// Everything a pilot keeps between runs: the hangar's part and the career's.
export interface PilotProfile extends EconomyProfile {
  career: CareerProfile;
}

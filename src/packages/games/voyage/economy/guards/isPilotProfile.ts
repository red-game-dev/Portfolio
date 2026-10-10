import { Guard, isArrayOf, isCount, isRecord, isText, isTextArray } from "@/packages/core/domain";
import { isLedgerSnapshot } from "@/packages/finance/ledger";

import { isCareerProfile } from "../../career/guards/isCareerProfile";
import { ItemStack } from "../domain/items";
import { EconomyProfile, PilotProfile, PilotRecords } from "../domain/profile";

const isStack: Guard<ItemStack> = (value): value is ItemStack => isRecord(value) && isText(value.id) && isCount(value.count);

const RECORD_KEYS: ReadonlyArray<keyof PilotRecords> = ["runs", "bestScore", "universes", "bosses", "rescues", "salvaged"];

// Records kept by an older release may lack a count added since; the hangar starts those at nothing.
const isRecords: Guard<Partial<PilotRecords>> = (value): value is Partial<PilotRecords> => isRecord(value) &&
  RECORD_KEYS.every((key) => value[key] === undefined || isCount(value[key]));

// Whether something read back from the browser is the hangar's part of a profile: when it was saved, a whole
// level, a hold of stacks, plans by name, a ledger, and records in whole numbers. What is in it is checked again as
// it is used: unknown things are dropped from the hold, and the ledger is replayed through its own checks.
export const isEconomyProfile: Guard<EconomyProfile> = (value): value is EconomyProfile => isRecord(value) && isCount(value.level) && isCount(value.savedAt) &&
  isArrayOf(isStack)(value.cargo) && isTextArray(value.blueprints) && isLedgerSnapshot(value.ledger) && isRecords(value.records);

// Whether something read back is a whole pilot's profile: the hangar's part and a career.
export const isPilotProfile: Guard<PilotProfile> = (value): value is PilotProfile => isEconomyProfile(value) && isRecord(value) && isCareerProfile(value.career);

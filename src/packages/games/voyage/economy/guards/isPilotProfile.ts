import { Guard, isArrayOf, isCount, isRecord, isText, isTextArray } from "@/packages/core/domain";
import { isLedgerSnapshot } from "@/packages/finance/ledger";

import { isCareerProfile } from "../../career/guards/isCareerProfile";
import { isArmoryProfile } from "../../gear/guards/isArmoryProfile";
import { isProgressProfile } from "../../progress/guards/isProgressProfile";
import { ItemStack } from "../domain/items";
import { BoostRecord, EconomyProfile, KeptSlot, PilotProfile, PilotRecords } from "../domain/profile";

const isStack: Guard<ItemStack> = (value): value is ItemStack => isRecord(value) && isText(value.id) && isCount(value.count);

const RECORD_KEYS: ReadonlyArray<keyof PilotRecords> = ["runs", "bestScore", "universes", "bosses", "rescues", "salvaged"];

// Records kept by an older release may lack a count added since; the hangar starts those at nothing.
const isRecords: Guard<Partial<PilotRecords>> = (value): value is Partial<PilotRecords> => isRecord(value) &&
  RECORD_KEYS.every((key) => value[key] === undefined || isCount(value[key]));

const isBoostRecord: Guard<BoostRecord> = (value): value is BoostRecord => isRecord(value) && isCount(value.charges) && isCount(value.finds);

// Every boost kept by name with whole charges and finds. Only the shape is checked: a name the boosts no longer know
// is dropped as the hangar reads it, never the whole profile.
const isBoosts = (value: unknown): boolean => isRecord(value) && Object.values(value).every(isBoostRecord);

const isSlot: Guard<KeptSlot | null> = (value): value is KeptSlot | null => value === null ||
  (isRecord(value) && isText(value.id) && (value.kind === "item" || value.kind === "boost" || value.kind === "weapon"));

// Whether something read back from the browser is the hangar's part of a profile: when it was saved, a whole
// level, a hold of stacks, plans by name, a ledger, and records in whole numbers. What is in it is checked again as
// it is used: unknown things are dropped from the hold, and the ledger is replayed through its own checks.
export const isEconomyProfile: Guard<EconomyProfile> = (value): value is EconomyProfile => isRecord(value) && isCount(value.level) && isCount(value.savedAt) &&
  isArrayOf(isStack)(value.cargo) && isTextArray(value.blueprints) && isLedgerSnapshot(value.ledger) && isRecords(value.records) &&
  isBoosts(value.boosts) && isArrayOf(isSlot)(value.bar);

// Whether something read back is a whole pilot's profile: the hangar's part, a career, an armoury and progress.
export const isPilotProfile: Guard<PilotProfile> = (value): value is PilotProfile => isEconomyProfile(value) && isRecord(value) && isCareerProfile(value.career) &&
  isArmoryProfile(value.armory) && isProgressProfile(value.progress);

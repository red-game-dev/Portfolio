import { Guard, isCount, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { ProgressProfile } from "../domain/progress";

const isCounts = (value: unknown): boolean => isRecord(value) && Object.values(value).every(isCount);

// Whether something read back is a pilot's progress: whole experience, whole counts of stars, unlock times and
// lifetime counts, the cosmetics by name, and the guide's step.
export const isProgressProfile: Guard<ProgressProfile> = (value): value is ProgressProfile => isRecord(value) && isCount(value.exp) && isCounts(value.stars) &&
  isCounts(value.achievements) && isCounts(value.counters) && isRecord(value.cosmetics) && isText(value.cosmetics.paint) && isText(value.cosmetics.trail) &&
  isTextArray(value.cosmetics.owned) && isRecord(value.guide) && isCount(value.guide.step) && typeof value.guide.isDone === "boolean";

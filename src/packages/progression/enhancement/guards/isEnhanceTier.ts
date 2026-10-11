import { Guard, isCount, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

import { EnhanceTier } from "../domain/types";

const isShare = (value: unknown): boolean => isFiniteNumber(value) && value >= 0 && value <= 1;

// Whether a tier read from content is one: a name, whole steps, a whole fall, two chances and a bonus.
export const isEnhanceTier: Guard<EnhanceTier> = (value): value is EnhanceTier => isRecord(value) && isText(value.id) && isCount(value.steps) &&
  value.steps > 0 && isCount(value.fall) && Array.isArray(value.chance) && value.chance.length === 2 && value.chance.every(isShare) && isFiniteNumber(value.bonus);

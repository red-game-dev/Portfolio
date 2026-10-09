import { Guard, isArrayOf, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

import { GHOST_STRIDE, GhostRun } from "../domain/ghost";

// Whether something read back is a ghost: its day, score, sampling interval and whole samples of numbers.
export const isGhostRun: Guard<GhostRun> = (value): value is GhostRun => isRecord(value) && isText(value.day) && isFiniteNumber(value.score) &&
  isFiniteNumber(value.every) && value.every > 0 && isArrayOf(isFiniteNumber)(value.samples) && value.samples.length % GHOST_STRIDE === 0;

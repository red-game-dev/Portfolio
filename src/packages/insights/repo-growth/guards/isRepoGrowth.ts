import { Guard, isArrayOf, isFiniteNumber, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { GrowthFrame, RepoGrowth } from "../domain/types";

const isGrowthFrame: Guard<GrowthFrame> = (value): value is GrowthFrame => isRecord(value) && isText(value.date) && isArrayOf(isFiniteNumber)(value.lines);

export const isRepoGrowth: Guard<RepoGrowth> = (value): value is RepoGrowth => isRecord(value) && isTextArray(value.districts) && isArrayOf(isGrowthFrame)(value.frames);

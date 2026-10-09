import { Guard, isArrayOf, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { CareerProfile, DailyRecord, MissionProgress } from "../domain/career";

const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

const isProgress: Guard<MissionProgress> = (value): value is MissionProgress => isRecord(value) && isText(value.id) && isCount(value.progress);

const isDaily: Guard<DailyRecord> = (value): value is DailyRecord => isRecord(value) && isText(value.day) && isCount(value.best) && isCount(value.runs);

// Whether something read back is a career in shape: experience, the board, what is done, the codex and the last
// daily voyage. Missions and codex entries this code no longer knows are dropped as it is read.
export const isCareerProfile: Guard<CareerProfile> = (value): value is CareerProfile => isRecord(value) && isCount(value.xp) &&
  isArrayOf(isProgress)(value.active) && isTextArray(value.done) && isCount(value.contracts) && isTextArray(value.codex) &&
  (value.daily === null || isDaily(value.daily));

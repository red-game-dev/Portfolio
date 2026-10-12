import { Guard, isArrayOf, isCount, isFiniteNumber, isRecord, isText, isTextArray } from "@/packages/core/domain";

import { CareerProfile, DailyRecord, MissionProgress, StoryProgress } from "../domain/career";

const isProgress: Guard<MissionProgress> = (value): value is MissionProgress => isRecord(value) && isText(value.id) && isCount(value.progress);

const isDaily: Guard<DailyRecord> = (value): value is DailyRecord => isRecord(value) && isText(value.day) && isCount(value.best) && isCount(value.runs);

// Only the story's shape: odd numbers in it are made to fit as the career reads it, never a reason to start the
// whole career again.
const isStory: Guard<StoryProgress> = (value): value is StoryProgress =>
  isRecord(value) && isFiniteNumber(value.chapter) && isArrayOf(isFiniteNumber)(value.progress);

// Whether something read back is a career in shape: experience, the board, what is done, the codex, the last daily
// voyage and where it is in the story (none for a career kept before the story began). Missions and codex entries
// this code no longer knows are dropped as it is read, and a story is made to fit the chapters it knows.
export const isCareerProfile: Guard<CareerProfile> = (value): value is CareerProfile => isRecord(value) && isCount(value.xp) &&
  isArrayOf(isProgress)(value.active) && isTextArray(value.done) && isCount(value.contracts) && isTextArray(value.codex) &&
  (value.daily === null || isDaily(value.daily)) && (value.story === undefined || isStory(value.story));

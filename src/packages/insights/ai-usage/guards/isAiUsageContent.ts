import {
  isArrayOf,
  isFiniteNumber,
  isOptionalBoolean,
  isRecord,
  isText,
  isTextArray
} from "@/packages/core/domain";

import {
  AiUsageAgents,
  AiUsageAreaGroup,
  AiUsageAreas,
  AiUsageContent,
  AiUsageExamples,
  AiUsageIntro,
  AiUsageMilestone,
  AiUsageMix,
  AiUsagePrinciple,
  AiUsageScreen,
  AiUsageStage,
  AiUsageTask,
  AiUsageTimeline
} from "../domain/types";

// Shape only. Business rules, such as shares adding up, belong to the validators.

export const isAiUsageTask = (value: unknown): value is AiUsageTask => isRecord(value)
  && isText(value.name)
  && isFiniteNumber(value.share);

const isIntro = (value: unknown): value is AiUsageIntro => isRecord(value)
  && isText(value.title)
  && isTextArray(value.description);

const isScreen = (value: unknown): value is AiUsageScreen => isRecord(value)
  && isTextArray(value.message)
  && isText(value.label);

const isMix = (value: unknown): value is AiUsageMix => isRecord(value)
  && isText(value.title)
  && isTextArray(value.description)
  && isArrayOf(isAiUsageTask)(value.tasks)
  && isTextArray(value.notes);

const isAreaGroup = (value: unknown): value is AiUsageAreaGroup => isRecord(value)
  && isText(value.label)
  && isTextArray(value.items);

const isAreas = (value: unknown): value is AiUsageAreas => isRecord(value)
  && isText(value.title)
  && isTextArray(value.description)
  && isArrayOf(isAreaGroup)(value.groups)
  && isTextArray(value.notes);

const isPrinciple = (value: unknown): value is AiUsagePrinciple => isRecord(value)
  && isText(value.title)
  && isText(value.description);

const isExamples = (value: unknown): value is AiUsageExamples => isRecord(value)
  && isText(value.title)
  && isArrayOf(isPrinciple)(value.items);

// The icon is opaque to the domain, so only its presence is checked.
const isStage = (value: unknown): value is AiUsageStage => isRecord(value)
  && isText(value.name)
  && "icon" in value
  && isArrayOf(isPrinciple)(value.principles);

const isAgents = (value: unknown): value is AiUsageAgents => isRecord(value)
  && isText(value.title)
  && isTextArray(value.description)
  && isArrayOf(isStage)(value.stages)
  && isExamples(value.examples)
  && isText(value.footer);

const isMilestone = (value: unknown): value is AiUsageMilestone => isRecord(value)
  && isText(value.period)
  && isText(value.title)
  && isText(value.description)
  && isOptionalBoolean(value.isCurrent);

const isTimeline = (value: unknown): value is AiUsageTimeline => isRecord(value)
  && isText(value.title)
  && isArrayOf(isMilestone)(value.milestones);

export const isAiUsageContent = <TIcon = unknown>(value: unknown): value is AiUsageContent<TIcon> => isRecord(value)
  && isIntro(value.intro)
  && isScreen(value.screen)
  && isMix(value.mix)
  && isAreas(value.areas)
  && isAgents(value.agents)
  && isTimeline(value.timeline);

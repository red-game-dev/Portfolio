import { SectionKey } from "@/config/sections";

const MINUTE = 60 * 1000;

// Haiku answers first, quickly and cheaply. "Go deeper" asks Sonnet for the longer answer.
export const ASK_MODELS = {
  quick: { model: "claude-haiku-4-5-20251001", maxTokens: 450 },
  deep: { model: "claude-sonnet-5-5", maxTokens: 1000 },
} as const;

// Per visitor, then per server instance in total. These bound the bill between the hard monthly cap, which
// is set on the API key's workspace in the Anthropic Console, not here.
export const ASK_RATES = {
  visitor: {
    quick: { limit: 12, windowMs: 10 * MINUTE },
    deep: { limit: 4, windowMs: 10 * MINUTE },
  },
  instance: {
    quick: { limit: 300, windowMs: 60 * MINUTE },
    deep: { limit: 60, windowMs: 60 * MINUTE },
  },
} as const;

// The sections an answer may cite, in the order the knowledge lists them. Each is a stop on the page the
// terminal can take the reader to.
export const ASK_SOURCES = [
  "about", "services", "history", "aiUsage", "forge", "skillAreas", "caseStudies", "projects", "recommendations",
] as const satisfies readonly SectionKey[];

export type AskSourceKey = (typeof ASK_SOURCES)[number];

export const ASK_ENDPOINT = "/api/ask/";

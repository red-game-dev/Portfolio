import { createHash } from "crypto";

import { ASK_ANSWER_CACHE_MS, ASK_DAILY_BUDGET_USD, ASK_MODELS, ASK_PROMPT_CACHE, ASK_RATES, ASK_RESILIENCE, ASK_SOURCES } from "@/config/ask";
import { portfolioData } from "@/data/resume";
import {
  AnswerCache,
  AnthropicMessagesModel,
  AskDepth,
  AskRecord,
  AskService,
  AskStore,
  MemoryStore,
  ResilientStore,
  SlidingWindowLimiter,
  SpendBudget,
  UpstashRestStore
} from "@/packages/ai/ask";
import { createAskKnowledge } from "@/services/ask/knowledge";
import { ASK_GUIDANCE, createAskInstructions } from "@/services/ask/prompt";

// Composition root for the agent, server side only: the page must never import this file.

const digest = (text: string, length = 16) => createHash("sha256").update(text)
.digest("hex")
.slice(0, length);

// One JSON line per event on stdout, which Vercel keeps as the function's logs.
const log = (event: string, fields: object) => process.stdout.write(`${JSON.stringify({ event, ...fields })}\n`);

// The Upstash store Vercel's Marketplace connects (it names the variables KV_* or UPSTASH_REDIS_REST_*), with
// memory behind it. Without one, limits hold per instance, which is fine locally and logged in production.
const createStore = (): AskStore => {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    log("ask.store", { kind: "memory" });

    return new MemoryStore();
  }

  return new ResilientStore(new UpstashRestStore({ url, token }), new MemoryStore(), {
    onFailure: (error) => log("ask.store", { kind: "fallback", error: error instanceof Error ? error.message : String(error) }),
  });
};

const limitersFor = (store: AskStore, scope: "visitor" | "everyone"): Record<AskDepth, SlidingWindowLimiter> => ({
  quick: new SlidingWindowLimiter(store, `ask:rate:${scope}:quick`, ASK_RATES[scope].quick),
  deep: new SlidingWindowLimiter(store, `ask:rate:${scope}:deep`, ASK_RATES[scope].deep),
});

const dailyBudgetMicros = () => (Number(process.env.ASK_DAILY_BUDGET_USD) || ASK_DAILY_BUDGET_USD) * 1000000;

// A visitor is counted by a salted hash of their address, so the store never holds an IP.
export const visitorKey = (address: string) => digest(`${process.env.ASK_SALT ?? "redgame.dev"}:${address}`);

let service: AskService | null = null;

// Null without an API key, or when ASK_ENABLED is "false", so the route can say the agent is resting.
export const getAskService = (): AskService | null => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || process.env.ASK_ENABLED === "false") {
    return null;
  }

  if (service) {
    return service;
  }

  const store = createStore();
  const knowledge = `${createAskInstructions(portfolioData.details.email)}\n\nKnowledge:\n\n${createAskKnowledge(portfolioData)}`;

  service = new AskService({
    model: new AnthropicMessagesModel({ apiKey }),
    knowledge,
    promptCache: ASK_PROMPT_CACHE,
    models: {
      quick: { ...ASK_MODELS.quick, guidance: ASK_GUIDANCE.quick },
      deep: { ...ASK_MODELS.deep, guidance: ASK_GUIDANCE.deep },
    },
    sourceKeys: ASK_SOURCES,
    guards: {
      visitor: limitersFor(store, "visitor"),
      everyone: limitersFor(store, "everyone"),
      budget: new SpendBudget(store, "ask:spend", dailyBudgetMicros()),
    },
    cache: new AnswerCache({
      store,
      version: `ask:answer:${digest(`${knowledge}${JSON.stringify(ASK_MODELS)}${JSON.stringify(ASK_GUIDANCE)}`, 12)}`,
      ttlMs: ASK_ANSWER_CACHE_MS,
      hash: (text) => digest(text, 24),
    }),
    resilience: ASK_RESILIENCE,
    onRecord: (record: AskRecord) => log("ask.answer", record),
  });

  return service;
};

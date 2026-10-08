import { createHash } from "crypto";

import { Redis } from "@upstash/redis";

import {
  ASK_ANSWER_CACHE_MS,
  ASK_DAILY_BUDGET_USD,
  ASK_FALLBACKS,
  ASK_HISTORY_TURNS,
  ASK_PROMPT_CACHE,
  ASK_RATES,
  ASK_RESILIENCE,
  ASK_SOURCES
} from "@/config/ask";
import { portfolioData } from "@/data/resume";
import { AnswerCache, AskDepth, AskRecord, AskService, PromptMapper } from "@/packages/ai/ask";
import { AiEngine, Route } from "@/packages/ai/engine";
import { KeyValueStore, MemoryStore, ResilientStore, UpstashStore } from "@/packages/server/kv";
import { DailyQuota, SlidingWindowLimiter } from "@/packages/server/quota";
import { PortfolioKnowledgeMapper } from "@/services/ask/knowledge";
import { ASK_GUIDANCE, createAskInstructions } from "@/services/ask/prompt";
import { createAskRoutes } from "@/services/ask/routes";

// Composition root for the agent, server side only: the page must never import this file. It builds the
// infrastructure (the shared store, the limits, the AI engine) and hands it to the domain service; the API route
// talks to the domain service and nothing else.

const digest = (text: string, length = 16) => createHash("sha256").update(text)
.digest("hex")
.slice(0, length);

// One JSON line per event on stdout, which Vercel keeps as the function's logs.
const log = (event: string, fields: object) => process.stdout.write(`${JSON.stringify({ event, ...fields })}\n`);

// Upstash Redis from Vercel's Marketplace (KV_* or UPSTASH_REDIS_REST_* variables), with memory behind it for
// outages. Without one, limits hold per instance, which is fine locally and logged in production.
const createStore = (): KeyValueStore => {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    log("ask.store", { kind: "memory" });

    return new MemoryStore();
  }

  const redis = new Redis({ url, token, automaticDeserialization: false, retry: { retries: 2, backoff: (attempt) => 50 * 2 ** attempt } });

  return new ResilientStore(new UpstashStore(redis), new MemoryStore(), {
    onFailure: (error) => log("ask.store", { kind: "fallback", error: error instanceof Error ? error.message : String(error) }),
  });
};

const limitersFor = (store: KeyValueStore, scope: "visitor" | "everyone"): Record<AskDepth, SlidingWindowLimiter> => ({
  quick: new SlidingWindowLimiter(store, `ask:rate:${scope}:quick`, ASK_RATES[scope].quick),
  deep: new SlidingWindowLimiter(store, `ask:rate:${scope}:deep`, ASK_RATES[scope].deep),
});

const dailyBudgetMicros = () => (Number(process.env.ASK_DAILY_BUDGET_USD) || ASK_DAILY_BUDGET_USD) * 1000000;

// What the answers depend on: change any of it and cached answers are left behind.
const versionOf = (knowledge: string, routes: Route[]) => digest(`${knowledge}${routes.map((route) => route.spec.id).join(",")}${JSON.stringify(ASK_GUIDANCE)}`, 12);

// A visitor is counted by a salted hash of their address, so the store never holds an IP.
export const visitorKey = (address: string) => digest(`${process.env.ASK_SALT ?? "redgame.dev"}:${address}`);

let service: AskService | null = null;

// Null when no provider has a key, or when ASK_ENABLED is "false", so the route can say the agent is resting.
export const getAskService = (): AskService | null => {
  if (process.env.ASK_ENABLED === "false") {
    return null;
  }

  if (service) {
    return service;
  }

  const routes = createAskRoutes(process.env);

  if (routes.quick.length === 0) {
    return null;
  }

  const store = createStore();
  const knowledge = `${createAskInstructions(portfolioData.details.email)}\n\nKnowledge:\n\n${new PortfolioKnowledgeMapper().map(portfolioData)}`;
  const version = versionOf(knowledge, [...routes.quick, ...routes.deep]);

  log("ask.routes", { version, quick: routes.quick.map((route) => route.spec.id), deep: routes.deep.map((route) => route.spec.id) });

  service = new AskService({
    engine: new AiEngine({ routes, fallbacks: ASK_FALLBACKS, resilience: ASK_RESILIENCE }),
    prompt: new PromptMapper({ knowledge, guidance: ASK_GUIDANCE, cache: ASK_PROMPT_CACHE, cacheKey: `ask-${version}` }),
    sourceKeys: ASK_SOURCES,
    guards: {
      visitor: limitersFor(store, "visitor"),
      everyone: limitersFor(store, "everyone"),
      budget: new DailyQuota(store, "ask:spend", dailyBudgetMicros()),
    },
    cache: new AnswerCache({ store, version: `ask:answer:${version}`, ttlMs: ASK_ANSWER_CACHE_MS, hash: (text) => digest(text, 24) }),
    limits: { historyTurns: ASK_HISTORY_TURNS },
    onRecord: (record: AskRecord) => log("ask.answer", record),
  });

  return service;
};

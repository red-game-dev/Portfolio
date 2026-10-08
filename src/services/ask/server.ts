import { ASK_MODELS, ASK_RATES, ASK_SOURCES } from "@/config/ask";
import { portfolioData } from "@/data/resume";
import { AnthropicMessagesModel, AskDepth, AskService, RateLimiter } from "@/packages/ai/ask";
import { createAskKnowledge } from "@/services/ask/knowledge";
import { ASK_GUIDANCE, createAskInstructions } from "@/services/ask/prompt";

// Composition root for the agent, server side only: the page must never import this file.
const visitorLimits = { quick: new RateLimiter(ASK_RATES.visitor.quick), deep: new RateLimiter(ASK_RATES.visitor.deep) };
const instanceLimits = { quick: new RateLimiter(ASK_RATES.instance.quick), deep: new RateLimiter(ASK_RATES.instance.deep) };

const allow = (client: string, depth: AskDepth) => visitorLimits[depth].take(client) && instanceLimits[depth].take("all");

let service: AskService | null = null;

// Null without an API key, so the route can answer that the agent is resting instead of failing.
export const getAskService = (): AskService | null => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return null;
  }

  service ??= new AskService({
    model: new AnthropicMessagesModel({ apiKey }),
    knowledge: `${createAskInstructions(portfolioData.details.email)}\n\nKnowledge:\n\n${createAskKnowledge(portfolioData)}`,
    models: {
      quick: { ...ASK_MODELS.quick, guidance: ASK_GUIDANCE.quick },
      deep: { ...ASK_MODELS.deep, guidance: ASK_GUIDANCE.deep },
    },
    sourceKeys: ASK_SOURCES,
    allow,
  });

  return service;
};

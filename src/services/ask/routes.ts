import { ASK_PROVIDER_ORDER, ASK_PROVIDERS, AskProviderConfig, AskProviderId } from "@/config/ask";
import { AnswerModel, AnthropicMessagesModel, AskDepth, AskRoute, OpenAICompatibleModel } from "@/packages/ai/ask";

type Env = Record<string, string | undefined>;

const isProvider = (name: string): name is AskProviderId => name in ASK_PROVIDERS;

// The providers to try, in order: ASK_PROVIDERS from the environment if set, else the default order with the
// free one first. Only those with a key are kept.
export const activeProviders = (env: Env): AskProviderId[] => {
  const order = env.ASK_PROVIDERS?.split(",").map((name) => name.trim())
.filter(isProvider) ?? ASK_PROVIDER_ORDER;

  return [...new Set(order)].filter((id) => Boolean(env[ASK_PROVIDERS[id].keyEnv]));
};

// One adapter per provider, chosen by the API it speaks.
const createModel = (config: AskProviderConfig, apiKey: string, fetcher?: typeof fetch): AnswerModel => (config.api === "anthropic"
  ? new AnthropicMessagesModel({ apiKey, fetcher })
  : new OpenAICompatibleModel({ apiKey, baseUrl: config.baseUrl ?? "", maxTokensField: config.maxTokensField, fetcher }));

// Per depth, every active provider's model for it, in order. A deep question then falls back to the quick
// models it has not already tried, so a busy deep model still gets an answer.
export const createAskRoutes = (env: Env, fetcher?: typeof fetch): Record<AskDepth, AskRoute[]> => {
  const providers = activeProviders(env).map((id) => {
    const config = ASK_PROVIDERS[id];

    return { id, config, model: createModel(config, env[config.keyEnv] ?? "", fetcher) };
  });
  const routesFor = (tier: AskDepth): AskRoute[] => providers.map(({ id, config, model }) => {
    const choice = config.models[tier];

    return { provider: id, label: choice.label, model, modelId: choice.id, maxTokens: choice.maxTokens, effort: choice.effort, price: choice.price, tier };
  });
  const deep = routesFor("deep");
  const quick = routesFor("quick");

  return {
    quick,
    deep: [...deep, ...quick.filter((route) => !deep.some((tried) => tried.provider === route.provider && tried.modelId === route.modelId))],
  };
};

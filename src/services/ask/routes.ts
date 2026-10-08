import { ASK_PROVIDER_ORDER, ASK_PROVIDERS, AskProviderConfig, AskProviderId } from "@/config/ask";
import { AskDepth } from "@/packages/ai/ask";
import { AnthropicProvider, ModelProvider, OpenAICompatibleProvider, Route } from "@/packages/ai/engine";
import { ApiClient } from "@/packages/http/api-client";

type Env = Record<string, string | undefined>;

const isProvider = (name: string): name is AskProviderId => name in ASK_PROVIDERS;

// The providers to try, in order: ASK_PROVIDERS from the environment if set, else the default order with the
// free one first. Only those with a key are kept.
export const activeProviders = (env: Env): AskProviderId[] => {
  const order = env.ASK_PROVIDERS?.split(",").map((name) => name.trim())
.filter(isProvider) ?? ASK_PROVIDER_ORDER;

  return [...new Set(order)].filter((id) => Boolean(env[ASK_PROVIDERS[id].keyEnv]));
};

// One engine provider per configured provider, chosen by the API it speaks, each with its own client instance
// made from `client`.
const createProvider = (id: AskProviderId, config: AskProviderConfig, apiKey: string, client: ApiClient): ModelProvider => (config.api === "anthropic"
  ? new AnthropicProvider({ apiKey, client })
  : new OpenAICompatibleProvider({
    name: id,
    apiKey,
    baseURL: config.baseURL ?? "",
    maxTokensField: config.maxTokensField,
    sendsCacheKey: config.sendsCacheKey,
    client,
  }));

// Per depth, every active provider's model for it, in order, as engine routes.
export const createAskRoutes = (env: Env, client: ApiClient = ApiClient.global()): Record<AskDepth, Route[]> => {
  const providers = activeProviders(env).map((id) => {
    const config = ASK_PROVIDERS[id];

    return { config, provider: createProvider(id, config, env[config.keyEnv] ?? "", client) };
  });

  const routesFor = (tier: AskDepth): Route[] => providers.map(({ config, provider }) => ({ provider, spec: config.models[tier], tier }));

  return { quick: routesFor("quick"), deep: routesFor("deep") };
};

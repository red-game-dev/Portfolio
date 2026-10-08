import { ApiClientConfig } from "../domain/types";

// No retries unless an instance asks for them: repeating a POST is only safe where the caller knows it is.
export const DEFAULT_API_CLIENT_CONFIG: ApiClientConfig = {
  timeout: 30 * 1000,
  retry: { retries: 0 },
};

// The settings of an instance made from `base`: headers and retry rules merged, the rest replaced.
export const mergeApiClientConfig = (base: ApiClientConfig, overrides: ApiClientConfig = {}): ApiClientConfig => ({
  ...base,
  ...overrides,
  headers: { ...base.headers, ...overrides.headers },
  retry: { ...base.retry, ...overrides.retry },
});

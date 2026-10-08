import { fetchf } from "fetchff";
import type { CustomFetcher } from "fetchff";

import { DEFAULT_API_CLIENT_CONFIG, mergeApiClientConfig } from "../config/defaults";
import { ApiClientConfig, ApiResult, CallOptions } from "../domain/types";
import { ApiResultMapper } from "../mappers/ApiResultMapper";

// An HTTP client on fetchff, for JSON and for streamed bodies. There is one global client for the whole app,
// which `configureGlobal` sets once, and any number of instances: `new ApiClient(config)` for one of its own, or
// `withConfig` to inherit from another (usually the global one) and add a base URL, headers or retry rules.
export class ApiClient {
  private static shared: ApiClient | null = null;
  private readonly config: ApiClientConfig;
  private readonly fetcher?: CustomFetcher;

  constructor(config: ApiClientConfig = {}, fetcher?: CustomFetcher) {
    this.config = mergeApiClientConfig(DEFAULT_API_CLIENT_CONFIG, config);
    this.fetcher = fetcher;
  }

  public static global(): ApiClient {
    ApiClient.shared ??= new ApiClient();

    return ApiClient.shared;
  }

  public static configureGlobal(config: ApiClientConfig, fetcher?: CustomFetcher): ApiClient {
    ApiClient.shared = new ApiClient(config, fetcher);

    return ApiClient.shared;
  }

  public withConfig(overrides: ApiClientConfig, fetcher: CustomFetcher | undefined = this.fetcher): ApiClient {
    return new ApiClient(mergeApiClientConfig(this.config, overrides), fetcher);
  }

  // A JSON body in, the parsed JSON out, as the type the caller expects. Pair it with a guard where the response
  // crosses a trust boundary.
  public post<TResponse, TBody = unknown>(path: string, body: TBody, options: CallOptions = {}): Promise<ApiResult<TResponse>> {
    return this.send<TResponse>(path, body, "json", options);
  }

  // A JSON body in, the response body left unread, to be consumed as it streams.
  public postStream<TBody = unknown>(path: string, body: TBody, options: CallOptions = {}): Promise<ApiResult<ReadableStream<Uint8Array>>> {
    return this.send<ReadableStream<Uint8Array>>(path, body, "stream", options);
  }

  // The body is serialised here, so fetchff sends it as it is and the caller's type stays the caller's.
  private async send<TResponse>(path: string, body: unknown, responseType: "json" | "stream", options: CallOptions): Promise<ApiResult<TResponse>> {
    const response = await fetchf<TResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
      responseType,
      baseURL: this.config.baseURL,
      headers: { "content-type": "application/json", ...this.config.headers, ...options.headers },
      timeout: options.timeout ?? this.config.timeout,
      retry: this.config.retry,
      signal: options.signal,
      strategy: "softFail",
      ...(this.fetcher ? { fetcher: this.fetcher } : {}),
    });

    return new ApiResultMapper<TResponse>().map(response);
  }
}

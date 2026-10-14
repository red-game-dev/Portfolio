import { ApiClient, RetryPolicy } from "@/packages/http/api-client";

import { ContactChannel, Delivery } from "../core/ContactChannel";
import { CONTACT_STATUS, ContactProblem, ContactRefusal, ContactRequest } from "../domain/types";

// How long the answer to whether the site can send is kept, and how close together asks share one request, so every
// form on a page (a card and the finale) asks once. The server's own answer is cached at the edge as long.
const STATUS_SECONDS = 30;
const STATUS_DEDUPE_MS = 2000;
// One retry for the read, on a network blip or a busy server; a send is never retried, since it could arrive twice.
const READ_RETRY: RetryPolicy = { retries: 1, delay: 400, methods: ["GET"], retryOn: [408, 500, 502, 504] };
const TIMEOUT_MS = 10 * 1000;

const REFUSALS = Object.keys(CONTACT_STATUS) as ContactRefusal[];

const refusalIn = (data: unknown): { refusal: ContactRefusal; problems: ContactProblem[] } | null => {
  if (typeof data !== "object" || data === null || !("error" in data) || !REFUSALS.includes(data.error as ContactRefusal)) {
    return null;
  }

  const problems = "problems" in data && Array.isArray(data.problems) ? data.problems as ContactProblem[] : [];

  return { refusal: data.error as ContactRefusal, problems };
};

// The site's own server, through an instance of the shared client: the endpoint, a timeout and a retry for the read
// only. It answers with the refusal the server gave (read from its body), or failed when no server answered.
export class SiteChannel extends ContactChannel {
  public readonly id = "site";
  private readonly client: ApiClient;
  private readonly endpoint: string;

  constructor(endpoint: string, client: ApiClient = ApiClient.global()) {
    super();
    this.endpoint = endpoint;
    this.client = client.withConfig({ timeout: TIMEOUT_MS, retry: READ_RETRY });
  }

  public async isOpen(): Promise<boolean> {
    const result = await this.client.get<unknown>(this.endpoint, { cacheSeconds: STATUS_SECONDS, dedupeMs: STATUS_DEDUPE_MS });

    return result.ok && typeof result.data === "object" && result.data !== null && "isOpen" in result.data && result.data.isOpen === true;
  }

  public async deliver(request: ContactRequest): Promise<Delivery> {
    const result = await this.client.post<unknown, ContactRequest>(this.endpoint, request);

    if (result.ok) {
      return { kind: "sent" };
    }

    const refused = refusalIn(result.data);

    return { kind: "refused", refusal: refused?.refusal ?? "failed", problems: refused?.problems ?? [] };
  }
}

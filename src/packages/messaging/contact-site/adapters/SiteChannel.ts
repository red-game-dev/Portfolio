import { ApiClient, RetryPolicy } from "@/packages/http/api-client";
import { CONTACT_PROBLEMS, CONTACT_STATUS, ContactChannel, ContactProblem, ContactRefusal, ContactRequest, Delivery } from "@/packages/messaging/contact";

// How long the answer to whether the site can send is kept, and how close together asks share one request, so every
// form on a page (a card and the finale) asks once. The server's own answer is cached at the edge as long.
const STATUS_SECONDS = 30;
const STATUS_DEDUPE_MS = 2000;
// One retry for the read, on no answer at all (status 0: a dropped connection or a timeout) or a busy server; a send is
// never retried here, since its idempotency key is the server's to use.
const READ_RETRY: RetryPolicy = { retries: 1, delay: 400, methods: ["GET"], retryOn: [0, 408, 500, 502, 504] };
const READ_TIMEOUT_MS = 8 * 1000;
// A send waits longer than the server's mail deadline, so the visitor hears the server's answer, not a timeout.
const SEND_TIMEOUT_MS = 25 * 1000;

// The refusal and problems in a server's answer, only those it knows.
const refusalIn = (data: unknown): { refusal: ContactRefusal; problems: ContactProblem[] } | null => {
  if (typeof data !== "object" || data === null || !("error" in data) || !(Object.keys(CONTACT_STATUS) as unknown[]).includes(data.error)) {
    return null;
  }

  const listed = "problems" in data && Array.isArray(data.problems) ? data.problems as unknown[] : [];

  return { refusal: data.error as ContactRefusal, problems: CONTACT_PROBLEMS.filter((problem) => listed.includes(problem)) };
};

// The site's own server, through an instance of the shared client: a timeout for each kind of call, and a retry for
// the read only. It says it cannot tell whether it is open when no answer came, and answers a send with the refusal the
// server gave (read from its body), or failed when no server answered.
export class SiteChannel extends ContactChannel {
  public readonly id = "site";
  private readonly client: ApiClient;
  private readonly endpoint: string;

  constructor(endpoint: string, client: ApiClient = ApiClient.global()) {
    super();
    this.endpoint = endpoint;
    this.client = client.withConfig({ retry: READ_RETRY });
  }

  public async isOpen(): Promise<boolean | null> {
    const result = await this.client.get<unknown>(this.endpoint, { cacheSeconds: STATUS_SECONDS, dedupeMs: STATUS_DEDUPE_MS, timeout: READ_TIMEOUT_MS });

    if (!result.ok || typeof result.data !== "object" || result.data === null || !("isOpen" in result.data)) {
      return null;
    }

    return result.data.isOpen === true;
  }

  public async deliver(request: ContactRequest): Promise<Delivery> {
    const result = await this.client.post<unknown, ContactRequest>(this.endpoint, request, { timeout: SEND_TIMEOUT_MS });

    if (result.ok) {
      return { kind: "sent" };
    }

    const refused = refusalIn(result.data);

    return { kind: "refused", refusal: refused?.refusal ?? "failed", problems: refused?.problems ?? [] };
  }
}

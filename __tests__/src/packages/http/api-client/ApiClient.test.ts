/**
 * @jest-environment node
 */
import { ApiClient, mergeApiClientConfig } from "@/packages/http/api-client";

import { fakeFetcher, SeenRequest } from "../../ai/fixtures/streams";

describe("ApiClient", () => {
  test("the global client is one instance until it is configured again", () => {
    const first = ApiClient.global();

    expect(ApiClient.global()).toBe(first);
    expect(ApiClient.configureGlobal({ timeout: 5000 })).toBe(ApiClient.global());
    expect(ApiClient.global()).not.toBe(first);
  });

  test("an instance made from another inherits its base URL and headers, and adds its own", async () => {
    const seen: SeenRequest[] = [];
    const base = new ApiClient({ baseURL: "https://api.example", headers: { "x-app": "redgame" } }, fakeFetcher([{ status: 200, body: "{\"ok\":true}" }], seen));
    const child = base.withConfig({ headers: { authorization: "Bearer k" } });
    const result = await child.post<{ ok: boolean }, { question: string }>("/v1/ask", { question: "Hi" });

    expect(result).toEqual({ ok: true, status: 200, data: { ok: true } });
    expect(seen[0].url).toBe("https://api.example/v1/ask");
    expect(seen[0].body).toEqual({ question: "Hi" });
    expect(seen[0].headers).toMatchObject({ "x-app": "redgame", "authorization": "Bearer k", "content-type": "application/json" });
  });

  test("a stream comes back unread, to be consumed as it arrives", async () => {
    const client = new ApiClient({}, fakeFetcher([{ status: 200, body: "data: 1\n\n" }]));
    const result = await client.postStream("https://api.example/s", {});

    expect(result.ok && await new Response(result.data).text()).toBe("data: 1\n\n");
  });

  test("a failure is a result with its status, never a throw", async () => {
    const result = await new ApiClient({}, fakeFetcher([{ status: 401, body: "no" }])).postStream("https://api.example/s", {});

    expect(result).toMatchObject({ ok: false, status: 401, isCancelled: false });
  });

  test("a POST is retried only when the policy says so", async () => {
    const seen: SeenRequest[] = [];
    const responses = [{ status: 503, body: "busy" }, { status: 200, body: "{}" }];
    const retrying = new ApiClient({ retry: { retries: 1, delay: 1, retryOn: [503], methods: ["POST"] } }, fakeFetcher(responses, seen));
    const plain: SeenRequest[] = [];

    expect((await retrying.post("https://api.example/x", {})).ok).toBe(true);
    expect(seen).toHaveLength(2);

    expect((await new ApiClient({}, fakeFetcher(responses, plain)).post("https://api.example/x", {})).ok).toBe(false);
    expect(plain).toHaveLength(1);
  });

  test("merging keeps the base headers and retry rules and replaces the rest", () => {
    expect(mergeApiClientConfig({ baseURL: "a", headers: { x: "1" }, retry: { retries: 1 } }, { baseURL: "b", headers: { y: "2" }, retry: { delay: 5 } }))
      .toEqual({ baseURL: "b", headers: { x: "1", y: "2" }, retry: { retries: 1, delay: 5 } });
  });
});

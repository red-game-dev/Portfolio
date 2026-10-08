import { StoreError } from "../domain/storeError";
import { AskStore } from "../domain/types";

export interface UpstashOptions {
  url: string;
  token: string;
  fetcher?: typeof fetch;
}

type Command = Array<string | number>;

interface PipelineResult {
  result?: unknown;
  error?: string;
}

// Redis over Upstash's REST API, every call one pipelined round trip, so it works from any serverless
// instance without a connection pool or a client library.
export class UpstashRestStore implements AskStore {
  private readonly options: UpstashOptions;

  constructor(options: UpstashOptions) {
    this.options = options;
  }

  // SET NX with an expiry, then INCRBY: the counter gets its time to live once, on whichever instance creates
  // it, and INCRBY keeps it. Works on every Redis version.
  public async add(key: string, by: number, ttlMs: number, alsoRead: string[] = []): Promise<{ value: number; read: number[] }> {
    const results = await this.pipeline([
      ["SET", key, 0, "PX", ttlMs, "NX"],
      ["INCRBY", key, by],
      ...alsoRead.map((other): Command => ["GET", other]),
    ]);

    return { value: Number(results[1]), read: results.slice(2).map((value) => Number(value ?? 0)) };
  }

  public async get(key: string): Promise<string | null> {
    const [value] = await this.pipeline([["GET", key]]);

    return typeof value === "string" ? value : null;
  }

  public async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.pipeline([["SET", key, value, "PX", ttlMs]]);
  }

  public async claim(key: string, ttlMs: number): Promise<boolean> {
    const [result] = await this.pipeline([["SET", key, 1, "PX", ttlMs, "NX"]]);

    return result === "OK";
  }

  private async pipeline(commands: Command[]): Promise<unknown[]> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(`${this.options.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { "authorization": `Bearer ${this.options.token}`, "content-type": "application/json" },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new StoreError(`The store answered ${response.status}`);
    }

    const results = (await response.json()) as PipelineResult[];
    const failed = results.find((item) => item.error);

    if (failed) {
      throw new StoreError(failed.error ?? "The store refused a command");
    }

    return results.map((item) => item.result);
  }
}

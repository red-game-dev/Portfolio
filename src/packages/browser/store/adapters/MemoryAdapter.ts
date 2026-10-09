import { StoreAdapter } from "../domain/types";

// Keeps values for as long as the page lives: the last resort when the browser keeps nothing, and the store tests
// run against.
export class MemoryAdapter implements StoreAdapter {
  public readonly kind = "memory";
  private readonly values = new Map<string, unknown>();

  public get(key: string): Promise<unknown> {
    return Promise.resolve(this.values.get(key));
  }

  public set(key: string, value: unknown): Promise<void> {
    this.values.set(key, structuredCopy(value));

    return Promise.resolve();
  }

  public delete(key: string): Promise<void> {
    this.values.delete(key);

    return Promise.resolve();
  }

  public keys(): Promise<string[]> {
    return Promise.resolve([...this.values.keys()]);
  }

  public close(): void {
    // Holds no connection.
  }
}

// A deep copy, so a caller changing what it saved does not change what is kept, as with the other adapters.
const structuredCopy = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)) as unknown);

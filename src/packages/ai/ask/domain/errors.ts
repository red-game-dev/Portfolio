// Statuses worth one more try: rate limited, overloaded, or a gateway that gave up.
const RETRYABLE = new Set([0, 408, 429, 500, 502, 503, 504, 529]);

// The model provider refused or failed the call. The status is the provider's HTTP status, 529 for an
// overloaded stream and 0 for a stream that broke.
export class ModelError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ModelError";
    this.status = status;
  }

  public get isRetryable(): boolean {
    return RETRYABLE.has(this.status);
  }
}

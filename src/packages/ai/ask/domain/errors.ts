// The model provider refused or failed the call. The status is the provider's HTTP status, 0 for a stream
// that broke after it started.
export class ModelError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ModelError";
    this.status = status;
  }
}

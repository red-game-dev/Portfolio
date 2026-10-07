export class ValidationError extends Error {
  public readonly errors: string[];

  constructor(errors: string[], message = `Validation failed: ${errors.join("; ")}`) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

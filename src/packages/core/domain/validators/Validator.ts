import { ValidationError } from "../errors/ValidationError";
import { ValidationResult } from "../types";

// Subclasses describe the rules in `validate`; callers choose between collecting the errors and
// failing fast with `assertValid`. Override `createError` to throw a domain specific error type.
export abstract class Validator<T> {
  public assertValid(value: T): void {
    const result = this.validate(value);

    if (!result.isValid) {
      throw this.createError(result.errors);
    }
  }

  protected createError(errors: string[]): Error {
    return new ValidationError(errors);
  }

  public abstract validate(value: T): ValidationResult;
}

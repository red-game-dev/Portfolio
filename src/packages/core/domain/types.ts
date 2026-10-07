export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Proves at runtime that an unknown value has the shape T, so data crossing a boundary (a CMS, an
// API, a file) is checked before the type system is allowed to trust it.
export type Guard<T> = (value: unknown) => value is T;

export const toValidationResult = (errors: string[]): ValidationResult => ({ isValid: errors.length === 0, errors });

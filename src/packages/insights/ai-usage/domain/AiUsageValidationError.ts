import { ValidationError } from "@/packages/core/domain";

export class AiUsageValidationError extends ValidationError {
  constructor(errors: string[]) {
    super(errors, `Invalid AI usage content: ${errors.join("; ")}`);
    this.name = "AiUsageValidationError";
  }
}

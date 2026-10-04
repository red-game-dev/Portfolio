import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { AiUsageValidationError } from "../domain/AiUsageValidationError";
import { AiUsageContent } from "../domain/types";
import { TaskCountValidator } from "./TaskCountValidator";

// Composes the rule sets for a whole content payload. New rules get their own validator and are
// added here, so each stays small and testable on its own.
export class AiUsageContentValidator extends Validator<AiUsageContent> {
  private readonly taskCounts: TaskCountValidator;

  constructor(taskCounts = new TaskCountValidator()) {
    super();
    this.taskCounts = taskCounts;
  }

  public validate(content: AiUsageContent): ValidationResult {
    const errors = [...this.taskCounts.validate(content.mix.tasks).errors];

    if (content.agents.stages.length === 0) {
      errors.push("at least one agent stage is required");
    }

    if (content.screen.message.length === 0) {
      errors.push("the screen needs at least one message line");
    }

    return toValidationResult(errors);
  }

  protected createError(errors: string[]): Error {
    return new AiUsageValidationError(errors);
  }
}

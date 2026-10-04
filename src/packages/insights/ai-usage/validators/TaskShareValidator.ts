import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { AI_USAGE_CONFIG } from "../config";
import { AiUsageValidationError } from "../domain/AiUsageValidationError";
import { AiUsageTask } from "../domain/types";
import { sumShares } from "../utils/shares";

// A breakdown claims to show a whole, so every share has to be a whole, positive number, names have
// to be unique, and together they have to add up to the total.
export class TaskShareValidator extends Validator<AiUsageTask[]> {
  private readonly totalShare: number;

  constructor(totalShare: number = AI_USAGE_CONFIG.totalShare) {
    super();
    this.totalShare = totalShare;
  }

  public validate(tasks: AiUsageTask[]): ValidationResult {
    if (tasks.length === 0) {
      return toValidationResult(["at least one task is required"]);
    }

    const errors = tasks
      .filter((task) => !Number.isInteger(task.share) || task.share <= 0)
      .map((task) => `"${task.name}" needs a whole, positive share, got ${task.share}`);
    const names = tasks.map((task) => task.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    const total = sumShares(tasks);

    if (duplicates.length > 0) {
      errors.push(`task names must be unique, repeated: ${[...new Set(duplicates)].join(", ")}`);
    }

    if (total !== this.totalShare) {
      errors.push(`shares must add up to ${this.totalShare}, got ${total}`);
    }

    return toValidationResult(errors);
  }

  protected createError(errors: string[]): Error {
    return new AiUsageValidationError(errors);
  }
}

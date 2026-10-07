import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { AiUsageValidationError } from "../domain/AiUsageValidationError";
import { AiUsageTask } from "../domain/types";

// Counts are measured floors, so each one has to be a whole, positive number, and names have to be
// unique so no row is shown twice.
export class TaskCountValidator extends Validator<AiUsageTask[]> {
  public validate(tasks: AiUsageTask[]): ValidationResult {
    if (tasks.length === 0) {
      return toValidationResult(["at least one task is required"]);
    }

    const errors = tasks
      .filter((task) => !Number.isInteger(task.count) || task.count <= 0)
      .map((task) => `"${task.name}" needs a whole, positive count, got ${task.count}`);
    const names = tasks.map((task) => task.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    if (duplicates.length > 0) {
      errors.push(`task names must be unique, repeated: ${[...new Set(duplicates)].join(", ")}`);
    }

    return toValidationResult(errors);
  }

  protected createError(errors: string[]): Error {
    return new AiUsageValidationError(errors);
  }
}

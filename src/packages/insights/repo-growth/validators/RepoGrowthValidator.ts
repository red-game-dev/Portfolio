import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { RepoGrowth } from "../domain/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// The rules a growth history must meet: frames in order of date, one count per district, and counts that are
// whole and never negative.
export class RepoGrowthValidator extends Validator<RepoGrowth> {
  public validate({ districts, frames }: RepoGrowth): ValidationResult {
    const errors = [
      ...(districts.length === 0 ? ["there are no districts"] : []),
      ...(new Set(districts).size === districts.length ? [] : ["a district is listed twice"]),
      ...(frames.length === 0 ? ["there are no frames"] : []),
      ...frames.flatMap((frame, index) => [
        ...(DATE.test(frame.date) ? [] : [`frame ${index + 1} has no YYYY-MM-DD date`]),
        ...(index > 0 && frame.date < frames[index - 1].date ? [`frame ${index + 1} comes before the frame it follows`] : []),
        ...(frame.lines.length === districts.length ? [] : [`frame ${index + 1} has ${frame.lines.length} counts for ${districts.length} districts`]),
        ...(frame.lines.every((count) => Number.isInteger(count) && count >= 0) ? [] : [`frame ${index + 1} has a count that is not a whole number of lines`]),
      ]),
    ];

    return toValidationResult(errors);
  }
}

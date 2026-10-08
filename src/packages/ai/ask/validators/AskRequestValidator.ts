import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { AskLimits } from "../config/limits";
import { AskBody } from "../domain/types";
import { isAskDepth } from "../guards/askBody";

// The rules a question must meet. One past the length limit is refused rather than cut, since a cut question may
// ask something else; history is not judged here, the mapper trims it.
export class AskRequestValidator extends Validator<AskBody> {
  private readonly limits: AskLimits;

  constructor(limits: AskLimits) {
    super();
    this.limits = limits;
  }

  public validate(body: AskBody): ValidationResult {
    const question = body.question.trim();

    return toValidationResult([
      ...(question ? [] : ["the question is empty"]),
      ...(question.length > this.limits.questionLength ? [`the question is over ${this.limits.questionLength} characters`] : []),
      ...(body.depth === undefined || isAskDepth(body.depth) ? [] : ["the depth is neither quick nor deep"]),
      ...(body.history === undefined || Array.isArray(body.history) ? [] : ["the history is not a list"]),
    ]);
  }
}

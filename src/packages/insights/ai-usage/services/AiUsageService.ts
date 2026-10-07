import { ContentService } from "@/packages/core/content";
import { Guard } from "@/packages/core/domain";

import { AiUsageValidationError } from "../domain/AiUsageValidationError";
import { AiUsageContent, AiUsageView } from "../domain/types";
import { isAiUsageContent } from "../guards/isAiUsageContent";
import { AiUsageViewMapper } from "../mappers/AiUsageViewMapper";
import { AiUsageContentValidator } from "../validators/AiUsageContentValidator";

// Source in, view out: guard the shape, validate the rules, map for rendering. The flow itself lives
// in ContentService; this class only picks the AI usage collaborators.
export class AiUsageService<TIcon = unknown> extends ContentService<AiUsageContent<TIcon>, AiUsageView<TIcon>> {
  protected readonly validator = new AiUsageContentValidator();
  protected readonly mapper = new AiUsageViewMapper<TIcon>();

  protected readonly guard: Guard<AiUsageContent<TIcon>> = (value): value is AiUsageContent<TIcon> => isAiUsageContent<TIcon>(value);

  protected createShapeError(): Error {
    return new AiUsageValidationError(["content from the source does not have the AI usage shape"]);
  }
}

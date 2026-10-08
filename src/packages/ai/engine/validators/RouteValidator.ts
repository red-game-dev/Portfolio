import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { ModelPrice, Route } from "../domain/types";

const PRICE_FIELDS: Array<keyof ModelPrice> = ["input", "cacheWrite", "cacheRead", "output"];

// The rules every route must meet before the engine is trusted with it, so a typo in a model's config fails at
// start up, not on a visitor's question.
export class RouteValidator extends Validator<Route[]> {
  public validate(routes: Route[]): ValidationResult {
    const errors = routes.flatMap(({ provider, spec, tier }, index) => {
      const where = `route ${index + 1} (${provider.name} ${spec.id || "?"})`;

      return [
        ...(spec.id.trim() ? [] : [`${where} has no model id`]),
        ...(spec.label.trim() ? [] : [`${where} has no label`]),
        ...(tier.trim() ? [] : [`${where} has no tier`]),
        ...(Number.isInteger(spec.maxTokens) && spec.maxTokens > 0 ? [] : [`${where} needs a positive whole maxTokens`]),
        ...PRICE_FIELDS.filter((field) => !(Number.isFinite(spec.price[field]) && spec.price[field] >= 0)).map((field) => `${where} has a bad ${field} price`),
      ];
    });

    return toValidationResult(errors);
  }
}

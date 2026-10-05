import {
  AiUsageContentValidator,
  AiUsageValidationError,
  TaskCountValidator
} from "@/packages/insights/ai-usage";

import { createAiUsageContent } from "./fixtures/content";

describe("insights/ai-usage validators", () => {
  const validator = new TaskCountValidator();

  test("accepts whole, positive counts with unique names", () => {
    expect(validator.validate([{ name: "A", count: 7916 }, { name: "B", count: 1087 }]).isValid).toBe(true);
  });

  test("counts do not have to add up to anything", () => {
    expect(validator.validate([{ name: "A", count: 3 }, { name: "B", count: 4 }]).isValid).toBe(true);
  });

  test("reports fractional, zero and negative counts by name", () => {
    const { errors } = validator.validate([
      { name: "Half", count: 10.5 },
      { name: "Zero", count: 0 },
      { name: "Negative", count: -1 },
    ]);

    expect(errors.filter((error) => error.includes("needs a whole, positive count"))).toHaveLength(3);
  });

  test("reports repeated task names", () => {
    const { errors } = validator.validate([{ name: "A", count: 50 }, { name: "A", count: 50 }]);

    expect(errors).toContain("task names must be unique, repeated: A");
  });

  test("an empty breakdown is invalid", () => {
    expect(validator.validate([]).isValid).toBe(false);
  });

  test("assertValid throws the domain error with every message", () => {
    expect(() => validator.assertValid([{ name: "A", count: 0 }])).toThrow(AiUsageValidationError);
  });

  test("the content validator composes the task rules with the section rules", () => {
    const content = createAiUsageContent({
      screen: { message: [], label: "" },
      agents: { title: "t", description: [], stages: [], examples: { title: "e", items: [] }, footer: "" },
    });
    const { errors } = new AiUsageContentValidator().validate(content);

    expect(errors).toEqual([
      "at least one agent stage is required",
      "the screen needs at least one message line",
    ]);
  });

  test("model tier shares must add up to 100 and none can be negative", () => {
    const content = createAiUsageContent();
    const short = { ...content.budget, tiers: [{ name: "Large", share: 95 }] };
    const negative = { ...content.budget, tiers: [{ name: "Large", share: 105 }, { name: "Small", share: -5 }] };

    expect(new AiUsageContentValidator().validate({ ...content, budget: short }).errors).toEqual(["model tier shares must add up to 100, got 95"]);
    expect(new AiUsageContentValidator().validate({ ...content, budget: negative }).errors).toEqual(["model tier shares cannot be negative"]);
  });
});

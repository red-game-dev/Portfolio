import {
  AiUsageContentValidator,
  AiUsageValidationError,
  TaskShareValidator
} from "@/packages/insights/ai-usage";

import { createAiUsageContent } from "./fixtures/content";

describe("insights/ai-usage validators", () => {
  const validator = new TaskShareValidator();

  test("accepts whole, positive shares that add up to 100", () => {
    expect(validator.validate([{ name: "A", share: 70 }, { name: "B", share: 30 }]).isValid).toBe(true);
  });

  test("reports a total that is off", () => {
    expect(validator.validate([{ name: "A", share: 70 }, { name: "B", share: 27 }]).errors).toEqual(["shares must add up to 100, got 97"]);
  });

  test("reports fractional, zero and negative shares by name", () => {
    const { errors } = validator.validate([
      { name: "Half", share: 50.5 },
      { name: "Zero", share: 0 },
      { name: "Negative", share: -1 },
      { name: "Rest", share: 50.5 },
    ]);

    expect(errors.filter((error) => error.includes("needs a whole, positive share"))).toHaveLength(4);
  });

  test("reports repeated task names", () => {
    const { errors } = validator.validate([{ name: "A", share: 50 }, { name: "A", share: 50 }]);

    expect(errors).toContain("task names must be unique, repeated: A");
  });

  test("an empty breakdown is invalid", () => {
    expect(validator.validate([]).isValid).toBe(false);
  });

  test("the total is configurable", () => {
    expect(new TaskShareValidator(10).validate([{ name: "A", share: 10 }]).isValid).toBe(true);
  });

  test("assertValid throws the domain error with every message", () => {
    expect(() => validator.assertValid([{ name: "A", share: 1 }])).toThrow(AiUsageValidationError);
  });

  test("the content validator composes the task rules with the section rules", () => {
    const content = createAiUsageContent({
      screen: { message: [], label: "" },
      agents: { title: "t", description: [], stages: [], footer: "" },
    });
    const { errors } = new AiUsageContentValidator().validate(content);

    expect(errors).toEqual([
      "at least one agent stage is required",
      "the screen needs at least one message line",
    ]);
  });
});

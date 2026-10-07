/* eslint-disable max-classes-per-file -- small doubles for the abstract bases, kept next to the test that uses them */
import { ContentService, InMemoryContentSource } from "@/packages/core/content";
import {
  Guard,
  isRecord,
  isText,
  Mapper,
  toValidationResult,
  ValidationError,
  ValidationResult,
  Validator
} from "@/packages/core/domain";

interface Greeting {
  name: string;
}

const isGreeting: Guard<Greeting> = (value): value is Greeting => isRecord(value) && isText(value.name);

class GreetingService extends ContentService<Greeting, string> {
  protected readonly validator = new (class extends Validator<Greeting> {
    public validate(greeting: Greeting): ValidationResult {
      return toValidationResult(greeting.name.trim() ? [] : ["name is empty"]);
    }
  })();

  protected readonly mapper = new (class extends Mapper<Greeting, string> {
    public map(greeting: Greeting): string {
      return `Hello, ${greeting.name}`;
    }
  })();

  protected readonly guard = isGreeting;
}

describe("core/content ContentService", () => {
  test("guards, validates and maps content from its source", () => {
    expect(new GreetingService(new InMemoryContentSource({ name: "Red" })).getView()).toBe("Hello, Red");
  });

  test("rejects content with the wrong shape before validating it", () => {
    const service = new GreetingService(new InMemoryContentSource({ title: "Red" }));

    expect(() => service.getView()).toThrow(ValidationError);
  });

  test("rejects content that has the right shape but breaks a rule", () => {
    const service = new GreetingService(new InMemoryContentSource({ name: "  " }));

    expect(() => service.getView()).toThrow("name is empty");
  });
});

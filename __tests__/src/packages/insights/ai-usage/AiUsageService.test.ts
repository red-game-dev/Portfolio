import { InMemoryContentSource } from "@/packages/core/content";
import {
  AiUsageService,
  AiUsageValidationError,
  AiUsageViewMapper,
  formatCountFloor,
  isAiUsageContent,
  scaleToCells
} from "@/packages/insights/ai-usage";

import { createAiUsageContent } from "./fixtures/content";

describe("insights/ai-usage", () => {
  test("the guard accepts well formed content and rejects missing sections", () => {
    const content = createAiUsageContent();
    const { timeline, ...withoutTimeline } = content;

    expect(isAiUsageContent(content)).toBe(true);
    expect(timeline).toBeDefined();
    expect(isAiUsageContent(withoutTimeline)).toBe(false);
    expect(isAiUsageContent(null)).toBe(false);
  });

  test("the mapper ranks tasks, floors their labels and scales bars to the largest row", () => {
    const view = new AiUsageViewMapper(32, 50).toMixView(createAiUsageContent().mix);

    expect(view.tasks.map((task) => task.name)).toEqual(["Coding", "Review", "Docs"]);
    expect(view.tasks.map((task) => task.label)).toEqual(["7,900+", "3,400+", "1,050+"]);
    expect(view.tasks.map((task) => task.litCells)).toEqual([32, 14, 4]);
    expect(view.trackLength).toBe(32);
  });

  test("labels round down, never up, so a floor never overstates the count", () => {
    expect(formatCountFloor(3085, 50)).toBe("3,050+");
    expect(formatCountFloor(2847, 50)).toBe("2,800+");
    expect(formatCountFloor(50, 50)).toBe("50+");
  });

  test("a small but real row still gets one lit cell", () => {
    expect(scaleToCells(1, 10000, 32)).toBe(1);
    expect(scaleToCells(0, 0, 32)).toBe(0);
  });

  test("the service turns raw source content into a view and keeps the host's icons", () => {
    const view = new AiUsageService<string>(new InMemoryContentSource(createAiUsageContent())).getView();

    expect(view.intro.title).toBe("How I use AI");
    expect(view.mix.tasks[0].name).toBe("Coding");
    expect(view.agents.stages[0].icon).toBe("file");
  });

  test("the service refuses content with the wrong shape", () => {
    const service = new AiUsageService(new InMemoryContentSource({ intro: "nope" }));

    expect(() => service.getView()).toThrow(AiUsageValidationError);
  });

  test("the service refuses a count that is not a whole, positive number", () => {
    const content = createAiUsageContent();
    const broken = { ...content, mix: { ...content.mix, tasks: [{ name: "Only", count: -5 }] } };

    expect(() => new AiUsageService(new InMemoryContentSource(broken)).getView()).toThrow("needs a whole, positive count");
  });
});

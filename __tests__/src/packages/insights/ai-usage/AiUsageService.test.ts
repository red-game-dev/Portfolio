import { InMemoryContentSource } from "@/packages/core/content";
import {
  AiUsageService,
  AiUsageValidationError,
  AiUsageViewMapper,
  isAiUsageContent
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

  test("the mapper ranks tasks, labels them and sizes the track to the largest share", () => {
    const view = new AiUsageViewMapper().toMixView(createAiUsageContent().mix);

    expect(view.tasks.map((task) => task.name)).toEqual(["Coding", "Review", "Docs"]);
    expect(view.tasks.map((task) => task.label)).toEqual(["60%", "25%", "15%"]);
    expect(view.trackLength).toBe(60);
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

  test("the service refuses a breakdown that does not add up", () => {
    const content = createAiUsageContent();
    const broken = { ...content, mix: { ...content.mix, tasks: [{ name: "Only", share: 90 }] } };

    expect(() => new AiUsageService(new InMemoryContentSource(broken)).getView()).toThrow("shares must add up to 100, got 90");
  });
});

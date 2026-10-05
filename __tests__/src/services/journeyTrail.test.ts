import { portfolioData } from "@/data/resume";
import { createJourneyTrail } from "@/services/journey/trail";

describe("journey trail", () => {
  const trail = createJourneyTrail(portfolioData);

  test("every section has a title the reader can see", () => {
    expect(trail.filter((section) => !section.title.trim())).toEqual([]);
  });

  test("no section appears twice", () => {
    expect(new Set(trail.map((section) => section.id)).size).toBe(trail.length);
  });

  test("the trail starts at the cover and ends at the finale", () => {
    expect(trail[0].id).toBe("section-started");
    expect(trail[trail.length - 1].id).toBe("section-Wow");
  });
});

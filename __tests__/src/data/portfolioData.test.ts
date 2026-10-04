import { portfolioData } from "@/data/resume";

const normalise = (name: string) => name.trim().toLowerCase();

describe("skill areas content", () => {
  const items = portfolioData.skillAreas.flatMap((area) => area.items);

  test("every area has a unique label and at least one item", () => {
    const labels = portfolioData.skillAreas.map((area) => area.label);

    expect(new Set(labels).size).toBe(labels.length);
    expect(portfolioData.skillAreas.every((area) => area.items.length > 0)).toBe(true);
  });

  test("no item is listed twice across areas", () => {
    expect(new Set(items.map(normalise)).size).toBe(items.length);
  });

  test("no item repeats a skill that already has a scored bar", () => {
    const scored = new Set(Object.values(portfolioData.skills)
      .flat()
      .map((skill) => normalise(skill.name)));

    expect(items.filter((item) => scored.has(normalise(item)))).toEqual([]);
  });
});

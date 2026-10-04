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

describe("portfolio copy", () => {
  test("no case study repeats a title and each one has points to read", () => {
    const titles = portfolioData.caseStudies.map((caseStudy) => caseStudy.title);

    expect(new Set(titles).size).toBe(titles.length);
    expect(portfolioData.caseStudies.every((caseStudy) => caseStudy.points.length > 0)).toBe(true);
  });

  test("nothing in the portfolio data uses an em dash", () => {
    expect(JSON.stringify(portfolioData)).not.toContain(String.fromCharCode(0x2014));
  });
});

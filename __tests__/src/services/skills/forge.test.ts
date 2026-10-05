import { portfolioData } from "@/data/resume";
import { createForgeStations } from "@/services/skills";

// Guards the forge against the data it is built from: every station renders, and the evidence rules hold.
describe("skill forge", () => {
  const stations = createForgeStations(portfolioData);
  const find = (name: string) => stations.flatMap((station) => station.items).find((item) => item.name === name);

  test("every forge station has items and a station id", () => {
    expect(stations.length).toBeGreaterThan(0);
    stations.forEach((station) => {
      expect(station.id).toMatch(/^section-skills-/);
      expect(station.items.length).toBeGreaterThan(0);
    });
  });

  test("a catch all project is never evidence", () => {
    stations.flatMap((station) => station.items).forEach((item) => expect(item.places).not.toContain("Other Projects"));
  });

  test("evidence in bullets counts, ambiguous names do not", () => {
    expect(find("Storybook")?.isTracked).toBe(true);
    expect(find("Git")?.places).not.toContain("Conrad Electronic Group");
  });

  test("untracked skills claim no time", () => {
    stations.flatMap((station) => station.items).filter((item) => !item.isTracked).forEach((item) => {
      expect(item.months).toBe(0);
      expect(item.rarity).toBe("common");
    });
  });
});

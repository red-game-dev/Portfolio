import { SKILL_FIRST_USED, SKILL_RELEASES } from "@/config/skills";
import { portfolioData } from "@/data/resume";
import { toMonthIndex } from "@/packages/insights/career";
import { createForgeStations, createSkillSources, skillFloors } from "@/services/skills";

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
    // Stacks stripped, so whatever is left was found in prose.
    const proseOnly = createSkillSources({
      ...portfolioData,
      experience: portfolioData.experience.map((entry) => ({ ...entry, techStack: [] })),
      education: [],
      projects: [],
    }).flatMap((source) => source.skills);

    expect(proseOnly).toContain("Storybook");
    expect(proseOnly).not.toContain("Git");
  });

  test("study counts, open ended courses do not", () => {
    expect(find("Photoshop")?.places).toContain("MCAST");
    stations.flatMap((station) => station.items).forEach((item) => expect(item.places).not.toContain("Online Courses"));
  });

  test("untracked skills claim no time", () => {
    stations
      .flatMap((station) => station.items)
      .filter((item) => !item.isTracked)
      .forEach((item) => {
        expect(item.months).toBe(0);
        expect(item.rarity).toBe("common");
      });
  });
});

describe("skill floors", () => {
  const listed = new Set(Object.values(portfolioData.skills).flat());

  it("only name skills that are listed, so a typo cannot silently do nothing", () => {
    expect(Object.keys({ ...SKILL_RELEASES, ...SKILL_FIRST_USED }).filter((name) => !listed.has(name))).toEqual([]);
  });

  it("keep the later of a release and a first use", () => {
    expect(skillFloors().Laravel).toBe(SKILL_FIRST_USED.Laravel);
  });

  it("never let a skill claim more years than it has existed", () => {
    const stations = createForgeStations(portfolioData);
    const asOf = toMonthIndex(portfolioData.roster.asOf);

    Object.entries(SKILL_RELEASES).forEach(([name, release]) => {
      const record = stations.flatMap((station) => station.items).find((item) => item.name === name);

      expect(record && record.months <= asOf - toMonthIndex(release) ? "ok" : name).toBe("ok");
    });
  });
});

import { findMentions, RarityPolicy, SkillExperienceMapper, skillKeys, sourceKeys } from "@/packages/insights/skills";

const sources = [
  { place: "Gods of Zushin", from: "Apr 2015", skills: ["C/C++", "Lua", "Vue.js"] },
  { place: "Chiliz", from: "Nov 2019", to: "Nov 2022", skills: ["Vue.js", "React Native", "Jest"] },
  { place: "HyperPlay", from: "Oct 2023", to: "Nov 2025", skills: ["Next.js (App Router, SSR)", "PostgreSQL"] },
];

describe("insights/skills", () => {
  test("normalises names so the same skill matches however it is written", () => {
    expect(skillKeys("Next.js (App Router, SSR)")).toEqual(["next"]);
    expect(skillKeys("NextJs")).toEqual(["next"]);
    expect(skillKeys("Vue.js / Nuxt")).toEqual(["vue", "nuxt"]);
    expect(skillKeys("C/C++")).toEqual(["c/c++"]);
  });

  test("a stack entry also counts for what it lists in brackets", () => {
    expect(sourceKeys("JS (JQuery, Backbone)")).toEqual(expect.arrayContaining(["jquery", "backbone"]));
    expect(sourceKeys("Next.js (App Router, SSR)")).toContain("next");
  });

  test("a skill counts only from the month it may: never before it existed, and a role that ended earlier drops out", () => {
    const mapper = new SkillExperienceMapper({ sources, asOf: "Oct 2026", notBefore: { Vue: "Jan 2018", Jest: "Dec 2022" } });

    // Gods of Zushin counts Vue from 2018 rather than 2015; Chiliz overlaps it and adds nothing.
    expect(mapper.map("Vue").years).toBe(8);
    // Chiliz ended before Jest's floor, so nothing is left to count.
    expect(mapper.map("Jest")).toEqual(expect.objectContaining({ years: 0, isTracked: false, places: [] }));
    // Skills without a floor are untouched.
    expect(mapper.map("Lua").years).toBe(11);
  });

  test("years and places come from the roles that list the skill, overlaps counted once", () => {
    const mapper = new SkillExperienceMapper({ sources, asOf: "Oct 2026" });
    const vue = mapper.map("Vue");

    expect(vue.places).toEqual(["Gods of Zushin", "Chiliz"]);
    expect(vue.years).toBe(11);
    expect(vue.rarity).toBe("legendary");
    expect(mapper.map("NextJs")).toEqual(expect.objectContaining({ years: 2, rarity: "rare", places: ["HyperPlay"] }));
  });

  test("aliases widen a skill to the names it goes by", () => {
    const mapper = new SkillExperienceMapper({ sources, asOf: "Oct 2026", aliases: { SQL: ["PostgreSQL"] } });

    expect(mapper.map("SQL").places).toEqual(["HyperPlay"]);
  });

  test("a skill no role lists is untracked, with no years claimed", () => {
    const record = new SkillExperienceMapper({ sources, asOf: "Oct 2026" }).map("Figma");

    expect(record).toEqual({ name: "Figma", years: 0, months: 0, places: [], rarity: "common", isTracked: false });
  });

  test("finds whole word mentions in prose and skips very short names", () => {
    const text = "Maintained a Storybook with interaction tests and wrote end to end Playwright tests in JavaScript.";

    expect(findMentions(text, ["Storybook", "Playwright", "Java", "Go", "TDD (Test Driven Development)"])).toEqual(["Storybook", "Playwright"]);
  });

  test("rarity tiers follow the configured minimums", () => {
    const policy = new RarityPolicy();

    expect([0, 2, 5, 8, 20].map((years) => policy.rarityFor(years))).toEqual(["common", "rare", "epic", "legendary", "legendary"]);
  });
});

import { pickSkillYears, startYear } from "@/components/Glance/utils";
import { formatPeriod, splitTitle } from "@/packages/insights/career";
import { createRosterLevels } from "@/services/roster";
import { ForgeStation } from "@/services/skills";
import { Character } from "@/types/roster";

const station = (items: Array<[string, number]>) => ({
  id: "s",
  title: "S",
  description: [],
  items: items.map(([name, years]) => ({ name, years, months: years * 12, rarity: "rare", places: [], isTracked: true })),
}) as unknown as ForgeStation;

describe("glance helpers", () => {
  test("titles split into the role and the place it was held", () => {
    expect(splitTitle("Founder, CEO at TasteTravellers")).toEqual({ role: "Founder, CEO", place: "TasteTravellers" });
    expect(splitTitle("Senior Frontend Engineer, reNFT Labs")).toEqual({ role: "Senior Frontend Engineer", place: "reNFT Labs" });
    expect(splitTitle("Freelance")).toEqual({ role: "Freelance", place: "" });
  });

  test("skills keep the order asked for, take the forge's years and drop anything under a year", () => {
    const stations = [station([["React", 9], ["Golang", 0]]), station([["Typescript", 9]])];

    expect(pickSkillYears(stations, ["Typescript", "Golang", "React", "Unknown"])).toEqual([
      { name: "Typescript", years: 9 },
      { name: "React", years: 9 },
    ]);
  });

  test("the start year comes from either date format", () => {
    expect(startYear("Apr 2015")).toBe(2015);
    expect(startYear("2021")).toBe(2021);
  });
});

describe("formatPeriod", () => {
  it("words the dates, ends in the present while running, and prefers a period written by hand", () => {
    expect(formatPeriod({ from: "Apr 2015" }, "{from} to {to}", "now")).toBe("Apr 2015 to now");
    expect(formatPeriod({ from: "2018", to: "2020" }, "{from} to {to}", "now")).toBe("2018 to 2020");
    expect(formatPeriod({ from: "2018", period: "On and off since 2018" }, "{from} to {to}", "now")).toBe("On and off since 2018");
  });
});

describe("createRosterLevels", () => {
  const character = (from: string, to?: string) => ({ tenures: [{ from, to }] }) as unknown as Character;
  const levels = createRosterLevels({ asOf: "Jan 2025" });

  it("levels a character by whole years in the role, never below 1", () => {
    expect(levels.level(character("Jan 2020", "Jan 2023"))).toBe(3);
    expect(levels.level(character("Jun 2024"))).toBe(1);
    expect(levels.years(character("Jun 2024"))).toBe(0);
  });
});


import { pickSkillYears, splitTitle, startYear } from "@/components/Glance/utils";
import { ForgeStation } from "@/services/skills";

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

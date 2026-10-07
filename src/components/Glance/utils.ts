import { ForgeStation } from "@/services/skills";

export interface SkillYears {
  name: string;
  years: number;
}

// The years behind each named skill, as the forge computed them. Skills with under a year are left out,
// since "0 years" undersells them and rounding up would overstate them.
export const pickSkillYears = (stations: ForgeStation[], names: string[]): SkillYears[] => {
  const years = new Map(stations.flatMap((station) => station.items.map((item) => [item.name, item.years] as const)));

  return names.flatMap((name) => {
    const value = years.get(name) ?? 0;

    return value >= 1 ? [{ name, years: value }] : [];
  });
};

// The year a role began, from "Apr 2015" or "2021".
export const startYear = (from: string) => Number(from.match(/\d{4}/)?.[0] ?? 0);

export interface ForgeContent {
  refining: string;
  // "{duration}" and "{places}" are replaced.
  tracked: string;
  years: string;
  months: string;
  untracked: string;
  rarity: Record<"legendary" | "epic" | "rare" | "common", string>;
  legendYears: string;
}

export interface TalentsContent {
  talentsLabel: string;
  languagesLabel: string;
  languages: Array<{ name: string; level: string }>;
}

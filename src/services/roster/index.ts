import { TenureCalculator } from "@/packages/insights/career";
import { Character, Roster } from "@/types/roster";

export interface RosterLevels {
  // Whole years spent in the character's roles.
  years: (character: Character) => number;
  // The level shown on the card: the years, never below 1, since every character starts at level 1.
  level: (character: Character) => number;
  // The year the character was first played.
  since: (character: Character) => number;
}

// One reading of the roster for every place that shows a level: the cards, the HUD, the glance sheet, the
// terminal and the hire dialog.
export const createRosterLevels = (roster: Pick<Roster, "asOf">): RosterLevels => {
  const calculator = new TenureCalculator(roster.asOf);
  const years = (character: Character) => calculator.years(character.tenures);

  return { years, level: (character) => Math.max(1, years(character)), since: (character) => calculator.since(character.tenures) };
};

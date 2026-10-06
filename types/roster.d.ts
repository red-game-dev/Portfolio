import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

export interface CharacterTenure {
  company: string;
  from: string;
  to?: string;
}

// One of my own scores from the Expertise list, shown as a character stat.
export interface CharacterStat {
  name: string;
  value: number;
}

export interface Character {
  characterClass: string;
  // Job titles this class covers, shown under the class name.
  titles?: string[];
  icon: FontAwesomeIconProps["icon"];
  tenures: CharacterTenure[];
  stats: CharacterStat[];
  abilities: string[];
  // One line on how the role is played, where the abilities alone do not say it.
  note?: string;
}

export interface Roster {
  // Levels are measured to this date, so they never drift between the build and the browser.
  asOf: string;
  labels: {
    level: string;
    years: string;
    since: string;
    abilities: string;
    play: string;
    playing: string;
    // The button in views without the game layer, which opens the same card.
    hire: string;
  };
  characters: Character[];
}

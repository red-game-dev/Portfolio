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
  icon: FontAwesomeIconProps["icon"];
  tenures: CharacterTenure[];
  stats: CharacterStat[];
  abilities: string[];
}

export interface Roster {
  // Levels are measured to this date, so they never drift between the build and the browser.
  asOf: string;
  labels: {
    level: string;
    years: string;
    since: string;
    guilds: string;
    abilities: string;
    play: string;
    playing: string;
  };
  characters: Character[];
}

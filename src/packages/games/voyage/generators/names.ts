import { pick, RandomSource } from "@/packages/math/random";
import { capitalise, fill } from "@/packages/text/format";

import { Disposition, UniverseNames } from "../domain/universe";

// A made up word of two or three syllables, from the host's own syllables.
export const nameWord = (random: RandomSource, names: UniverseNames): string => {
  const syllables = [pick(random, names.starts), pick(random, names.middles)];

  if (random() < 0.35) {
    syllables.push(pick(random, names.middles));
  }

  return capitalise(syllables.join("").toLowerCase());
};

// A universe's name: a made up word and the kind of place it is, "Veldara Reach".
export const universeName = (random: RandomSource, names: UniverseNames): string => `${nameWord(random, names)} ${pick(random, names.places)}`;

// A faction's name: a made up word and what its manner makes it, "Thalix Swarm".
export const factionName = (random: RandomSource, names: UniverseNames, disposition: Disposition): string => (
  `${nameWord(random, names)} ${pick(random, names.factions[disposition])}`
);

// A system's belt of rocks, named for its star: "the Veldara belt".
export const beltName = (names: UniverseNames, star: string): string => fill(names.belt, { star });

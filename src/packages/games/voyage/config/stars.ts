import { GalaxyKind, StarKind } from "../domain/universe";

// A kind of star as it really is: its surface temperature (K), its brightness, radius and mass against the Sun's,
// and how restless its surface looks (spots, and the corona round it).
export interface StarClass {
  temperatureK: number;
  luminosity: number;
  radius: number;
  mass: number;
  spots: number;
  corona: number;
}

// Each kind from a star we know: Luhman 16 for a brown dwarf, a typical red dwarf like Barnard's Star, Epsilon
// Eridani, the Sun, Altair, Regulus for a blue main sequence star, Arcturus for a red giant, Rigel, Betelgeuse, VY
// Canis Majoris, a Wolf-Rayet star like those of WR 104, Sirius B, and a neutron star ten kilometres across.
export const STAR_CLASSES: Readonly<Record<StarKind, StarClass>> = {
  brownDwarf: { temperatureK: 1300, luminosity: 0.00003, radius: 0.1, mass: 0.05, spots: 0.4, corona: 0.2 },
  red: { temperatureK: 3200, luminosity: 0.02, radius: 0.3, mass: 0.25, spots: 0.9, corona: 0.7 },
  orange: { temperatureK: 4600, luminosity: 0.3, radius: 0.75, mass: 0.75, spots: 0.6, corona: 0.75 },
  yellow: { temperatureK: 5770, luminosity: 1, radius: 1, mass: 1, spots: 0.5, corona: 0.85 },
  white: { temperatureK: 7700, luminosity: 10, radius: 1.8, mass: 1.8, spots: 0.2, corona: 0.9 },
  blue: { temperatureK: 12000, luminosity: 300, radius: 3.8, mass: 3.8, spots: 0.1, corona: 1 },
  giant: { temperatureK: 4300, luminosity: 170, radius: 25, mass: 1.1, spots: 1, corona: 0.6 },
  blueSupergiant: { temperatureK: 12100, luminosity: 120000, radius: 79, mass: 21, spots: 0.15, corona: 1 },
  redSupergiant: { temperatureK: 3600, luminosity: 100000, radius: 760, mass: 17, spots: 1, corona: 0.5 },
  hypergiant: { temperatureK: 3490, luminosity: 270000, radius: 1420, mass: 17, spots: 1, corona: 0.45 },
  wolfRayet: { temperatureK: 50000, luminosity: 300000, radius: 2.5, mass: 20, spots: 0, corona: 1 },
  whiteDwarf: { temperatureK: 25000, luminosity: 0.03, radius: 0.012, mass: 0.6, spots: 0, corona: 0.4 },
  neutron: { temperatureK: 600000, luminosity: 0.0002, radius: 0.000014, mass: 1.4, spots: 0, corona: 0.25 },
};

// The dead stars are drawn no smaller than this (world units), and pull at their surface this hard, far past any
// engine, so their pull is told from their surface rather than their mass.
export const COMPACT: Readonly<Partial<Record<StarKind, { radius: number; pull: number }>>> = {
  whiteDwarf: { radius: 0.25, pull: 4 },
  neutron: { radius: 0.08, pull: 30 },
};

// How common each kind is in each kind of galaxy. Most stars anywhere are red dwarfs. Spiral arms are where stars
// are born, so the young, hot and short lived (blue stars, supergiants, Wolf-Rayet stars) are found there and in
// starbursting irregulars and rings; an elliptical is old, its stars red, orange and dying giants, its dead stars
// many and its young ones none; a dwarf is old, poor in metals and dim.
export const STAR_WEIGHTS: Readonly<Record<GalaxyKind, ReadonlyArray<readonly [StarKind, number]>>> = {
  spiral: [
    ["red", 28], ["orange", 18], ["yellow", 14], ["white", 9], ["blue", 7], ["giant", 6], ["blueSupergiant", 4], ["redSupergiant", 4],
    ["hypergiant", 2.5], ["wolfRayet", 1.5], ["brownDwarf", 4], ["whiteDwarf", 4], ["neutron", 3],
  ],
  barred: [
    ["red", 28], ["orange", 18], ["yellow", 14], ["white", 9], ["blue", 6], ["giant", 6], ["blueSupergiant", 3.5], ["redSupergiant", 4],
    ["hypergiant", 2.5], ["wolfRayet", 1], ["brownDwarf", 4], ["whiteDwarf", 4], ["neutron", 3],
  ],
  elliptical: [
    ["red", 34], ["orange", 22], ["yellow", 8], ["white", 2], ["giant", 12], ["redSupergiant", 0.5], ["brownDwarf", 5], ["whiteDwarf", 10], ["neutron", 6],
  ],
  irregular: [
    ["red", 24], ["orange", 14], ["yellow", 12], ["white", 10], ["blue", 10], ["giant", 5], ["blueSupergiant", 6], ["redSupergiant", 4],
    ["hypergiant", 3], ["wolfRayet", 3], ["brownDwarf", 4], ["whiteDwarf", 3], ["neutron", 4],
  ],
  dwarf: [["red", 40], ["orange", 18], ["yellow", 8], ["white", 3], ["giant", 8], ["brownDwarf", 8], ["whiteDwarf", 9], ["neutron", 4]],
  ring: [
    ["red", 24], ["orange", 14], ["yellow", 12], ["white", 10], ["blue", 9], ["giant", 5], ["blueSupergiant", 5], ["redSupergiant", 4],
    ["hypergiant", 2.5], ["wolfRayet", 2], ["brownDwarf", 4], ["whiteDwarf", 4], ["neutron", 4],
  ],
};

// How often a star of each kind shares its system, as surveys find: massive stars almost always do, Sun-like stars
// about half the time, red dwarfs mostly not. The chances of a close pair, a wide pair and a triple. A giant has
// only wide partners: anything close would orbit inside it. Red supergiants and hypergiants are drawn alone: a
// partner far enough out to leave their worlds a stable orbit would lie beyond where a system can be crossed.
export const MULTIPLES: Readonly<Partial<Record<StarKind, readonly [number, number, number]>>> = {
  brownDwarf: [0.1, 0.08, 0.02],
  red: [0.12, 0.12, 0.03],
  orange: [0.15, 0.2, 0.06],
  yellow: [0.15, 0.22, 0.08],
  white: [0.2, 0.25, 0.1],
  blue: [0.3, 0.25, 0.15],
  giant: [0, 0.3, 0],
  blueSupergiant: [0, 0.55, 0],
  wolfRayet: [0.35, 0.2, 0.15],
};

// What can keep a star company: a lighter main sequence star, or a white or brown dwarf.
export const PARTNERS: readonly StarKind[] = ["brownDwarf", "red", "orange", "yellow", "white", "blue", "whiteDwarf"];

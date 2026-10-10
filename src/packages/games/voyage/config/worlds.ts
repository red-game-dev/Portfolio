import type { SurfaceKind } from "@/packages/graphics/globe";

import { StarKind, WorldClass } from "../domain/universe";

// The air a kind of world keeps: none; a thin wisp (Mars); air like ours; the thick air of a super-Earth; a runaway
// greenhouse (Venus); a cold hazy nitrogen sky (Titan); a giant's hydrogen; the rock vapour over a lava world; and
// the steamy air of an ocean world.
export type AirRecipe = "none" | "thin" | "earthlike" | "thick" | "greenhouse" | "titan" | "giant" | "vapour" | "steam";

// A kind of world as it is made: the recipe its globe is painted with; the equilibrium temperatures (Celsius) it is
// found at and how likely it is there against the others; its radius in Earth radii and its density against
// Earth's (the pull at its surface goes as their product); whether it is a giant with no ground; its air; how many
// moons it keeps and the chance of rings; the stars it needs (an eyeball needs a dwarf near enough to lock it, a
// face always to its star) or never forms round (no giant forms in a brown dwarf's small disc, nor round a pulsar,
// whose planets are the rubble of its supernova); how much it needs heavy elements to form (scaled by a galaxy's metals to that power);
// and whether life could arise on it.
export interface WorldClassSpec {
  surface: SurfaceKind;
  coldest: number;
  warmest: number;
  weight: number;
  radius: readonly [number, number];
  density: readonly [number, number];
  isGiant: boolean;
  air: AirRecipe;
  moons: readonly [number, number];
  rings: number;
  stars?: readonly StarKind[];
  avoids?: readonly StarKind[];
  isLocked?: boolean;
  metals: number;
  isHabitable?: boolean;
}

const DWARFS: readonly StarKind[] = ["red", "orange", "brownDwarf"];
const NO_GIANTS: readonly StarKind[] = ["brownDwarf", "neutron"];

// Each from worlds we know: KOI-1843.03 and Mercury for iron worlds, CoRoT-7b, 55 Cancri e (perhaps carbon), Mars,
// Earth, LHS 1140b, Kepler-22b and TOI-270 d for water, TRAPPIST-1e and Proxima b, Venus, Titan, OGLE-2005-BLG-390Lb,
// Io, GJ 1214b, Neptune, Jupiter, 51 Pegasi b and HD 209458b, Kepler-51's super-puffs, and the stripped core
// TOI-849b. Moons are made from the same kinds.
export const WORLD_CLASSES: Readonly<Record<WorldClass, WorldClassSpec>> = {
  iron: {
    surface: "cratered", coldest: 150, warmest: 1600, weight: 1, radius: [0.35, 1.2], density: [1.2, 1.7],
    isGiant: false, air: "none", moons: [0, 0], rings: 0, metals: 1.4,
  },
  lava: {
    surface: "lava", coldest: 900, warmest: 3000, weight: 3, radius: [0.8, 1.8], density: [1, 1.3],
    isGiant: false, air: "vapour", moons: [0, 0], rings: 0, metals: 1,
  },
  carbon: {
    surface: "lava", coldest: 400, warmest: 2200, weight: 0.6, radius: [1, 2], density: [0.8, 1.1],
    isGiant: false, air: "vapour", moons: [0, 1], rings: 0, metals: 1.2,
  },
  rocky: {
    surface: "rocky", coldest: -260, warmest: 450, weight: 2, radius: [0.3, 1.2], density: [0.8, 1.1],
    isGiant: false, air: "none", moons: [0, 1], rings: 0, metals: 1,
  },
  cratered: {
    surface: "cratered", coldest: -260, warmest: 300, weight: 1.5, radius: [0.2, 0.8], density: [0.6, 1],
    isGiant: false, air: "none", moons: [0, 1], rings: 0, metals: 0.8,
  },
  desert: {
    surface: "desert", coldest: -90, warmest: 220, weight: 2, radius: [0.5, 1.3], density: [0.7, 1],
    isGiant: false, air: "thin", moons: [0, 2], rings: 0, metals: 1,
  },
  terran: {
    surface: "terran", coldest: -25, warmest: 50, weight: 6, radius: [0.8, 1.4], density: [0.9, 1.1],
    isGiant: false, air: "earthlike", moons: [0, 2], rings: 0.03, metals: 1, isHabitable: true,
  },
  superEarth: {
    surface: "terran", coldest: -45, warmest: 110, weight: 3, radius: [1.3, 1.9], density: [1, 1.4],
    isGiant: false, air: "thick", moons: [0, 2], rings: 0.05, metals: 1.2, isHabitable: true,
  },
  ocean: {
    surface: "terran", coldest: -15, warmest: 90, weight: 3.5, radius: [1, 2.3], density: [0.55, 0.9],
    isGiant: false, air: "steam", moons: [0, 2], rings: 0.03, metals: 0.8, isHabitable: true,
  },
  eyeball: {
    surface: "eyeball", coldest: -70, warmest: 45, weight: 6, radius: [0.8, 1.5], density: [0.9, 1.1],
    isGiant: false, air: "earthlike", moons: [0, 0], rings: 0, metals: 1, stars: DWARFS, isLocked: true, isHabitable: true,
  },
  toxic: {
    surface: "toxic", coldest: 120, warmest: 650, weight: 3, radius: [0.8, 1.3], density: [0.9, 1],
    isGiant: false, air: "greenhouse", moons: [0, 1], rings: 0, metals: 1,
  },
  haze: {
    surface: "haze", coldest: -230, warmest: -110, weight: 2, radius: [0.3, 1.1], density: [0.35, 0.6],
    isGiant: false, air: "titan", moons: [0, 1], rings: 0, metals: 0.6,
  },
  icy: {
    surface: "icy", coldest: -273, warmest: -55, weight: 3, radius: [0.3, 1.6], density: [0.35, 0.7],
    isGiant: false, air: "none", moons: [0, 2], rings: 0.04, metals: 0.5,
  },
  volcanic: {
    surface: "volcanic", coldest: -220, warmest: 400, weight: 0.4, radius: [0.3, 1], density: [0.8, 1],
    isGiant: false, air: "thin", moons: [0, 1], rings: 0, metals: 1,
  },
  miniNeptune: {
    surface: "haze", coldest: -220, warmest: 450, weight: 4, radius: [2, 3.8], density: [0.15, 0.4],
    isGiant: true, avoids: NO_GIANTS, air: "giant", moons: [0, 3], rings: 0.15, metals: 0.9,
  },
  iceGiant: {
    surface: "iceGiant", coldest: -273, warmest: -90, weight: 2, radius: [3.5, 4.6], density: [0.25, 0.35],
    isGiant: true, avoids: NO_GIANTS, air: "giant", moons: [1, 5], rings: 0.3, metals: 1.1,
  },
  gas: {
    surface: "gas", coldest: -273, warmest: 180, weight: 3, radius: [8.5, 12], density: [0.15, 0.3],
    isGiant: true, avoids: NO_GIANTS, air: "giant", moons: [2, 7], rings: 0.45, metals: 1.6,
  },
  hotJupiter: {
    surface: "hotJupiter", coldest: 700, warmest: 2300, weight: 1, radius: [11, 20], density: [0.05, 0.2],
    isGiant: true, avoids: NO_GIANTS, air: "giant", moons: [0, 0], rings: 0, metals: 1.8,
  },
  puffy: {
    surface: "haze", coldest: -120, warmest: 320, weight: 0.6, radius: [6, 10], density: [0.01, 0.04],
    isGiant: true, avoids: NO_GIANTS, air: "giant", moons: [0, 2], rings: 0.2, metals: 1,
  },
  chthonian: {
    surface: "volcanic", coldest: 1000, warmest: 3000, weight: 0.6, radius: [1.5, 3], density: [1.2, 2],
    isGiant: false, air: "none", moons: [0, 0], rings: 0, metals: 1.5,
  },
  rogue: {
    surface: "rogue", coldest: -273, warmest: -273, weight: 0, radius: [0.4, 1.5], density: [0.6, 1.1],
    isGiant: false, air: "none", moons: [0, 1], rings: 0, metals: 0,
  },
};

// Every kind, in the order the codex lists them.
export const WORLD_CLASS_IDS: readonly WorldClass[] = [
  "terran", "superEarth", "ocean", "eyeball", "desert", "toxic", "haze", "icy", "volcanic", "rocky", "cratered", "iron", "lava", "carbon", "chthonian",
  "miniNeptune", "iceGiant", "gas", "hotJupiter", "puffy", "rogue",
];

// What moons can be, by how warm it is where their planet circles: a habitable moon of a giant in the warm zone (as
// Pandora is imagined), and otherwise the kinds of our own giants' moons: Io's volcanoes, Titan's haze, Europa's
// ice, Callisto's craters.
export const MOON_CLASSES: readonly WorldClass[] = ["haze", "icy", "cratered", "rocky", "terran", "desert"];

// The molar mass (kg/mol) of the gases worlds' air is mostly of.
export const GAS = { nitrogen: 0.028, carbonDioxide: 0.044, sulphurDioxide: 0.064, hydrogen: 0.0023, steam: 0.026, rockVapour: 0.06 };

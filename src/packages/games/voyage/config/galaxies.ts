import { GalaxyKind } from "../domain/universe";

// A kind of galaxy: how common it is, how rich its stars are in the heavy elements planets are built from (against
// our own neighbourhood's), so how many rocky worlds and giants its systems hold, the colours it shines in (a core
// of old gold stars, and arms or a body coloured by its youngest), and how many spiral arms it has.
export interface GalaxyClass {
  weight: number;
  metals: number;
  core: string;
  arms: string;
  armCount: readonly [number, number];
}

export const GALAXY_KINDS: readonly GalaxyKind[] = ["spiral", "barred", "elliptical", "irregular", "dwarf", "ring"];

// Our Milky Way is a barred spiral, Andromeda a spiral, M87 an elliptical, the Large Magellanic Cloud an irregular,
// the Sagittarius Dwarf a dwarf, Hoag's Object a ring.
export const GALAXIES: Readonly<Record<GalaxyKind, GalaxyClass>> = {
  spiral: { weight: 30, metals: 1, core: "#ffe2b0", arms: "#a9c4ff", armCount: [2, 4] },
  barred: { weight: 30, metals: 1.1, core: "#ffdcaa", arms: "#b3c8ff", armCount: [2, 2] },
  elliptical: { weight: 15, metals: 1.3, core: "#ffd29a", arms: "#ffc890", armCount: [0, 0] },
  irregular: { weight: 12, metals: 0.6, core: "#d8e4ff", arms: "#9fd0ff", armCount: [0, 0] },
  dwarf: { weight: 8, metals: 0.35, core: "#ffe6c4", arms: "#ffe0b8", armCount: [0, 0] },
  ring: { weight: 5, metals: 0.9, core: "#ffd9a0", arms: "#9cc2ff", armCount: [0, 0] },
};

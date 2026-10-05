import { faMountain, faTree, faWater } from "@fortawesome/pro-duotone-svg-icons";

import { ProjectKind } from "@/types/projects";

// Region colours on the world map, one per kind of project.
export const KIND_COLOURS: Record<ProjectKind, string> = {
  game: "#ffc45c",
  web3: "#b896ff",
  product: "#4fd8ff",
  community: "#4bffa5",
  archive: "#8b949e",
};

// Columns of hexes on wide and narrow screens. Narrow screens get bigger hexes rather than tiny ones.
export const MAP_COLUMNS = { wide: 6, narrow: 4 } as const;

export const NARROW_QUERY = "(max-width: 767px)";

// Decorative terrain between regions.
export const TERRAIN_ICONS = [faMountain, faTree, faWater];

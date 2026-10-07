
import { faMountain, faTree, faWater } from "@fortawesome/free-solid-svg-icons";

import { ZONE_ACCENTS } from "@/config/zones";
import { ProjectKind } from "@/types/projects";

// Region colours on the world map, one per kind of project, from the zone the kind belongs to.
export const KIND_COLOURS: Record<ProjectKind, string> = {
  game: ZONE_ACCENTS.mmo,
  web3: ZONE_ACCENTS.chain,
  product: ZONE_ACCENTS.ai,
  community: ZONE_ACCENTS.matrix,
  archive: "#8b949e",
};

// Columns of hexes on wide and narrow screens. Narrow screens get bigger hexes rather than tiny ones.
export const MAP_COLUMNS = { wide: 6, narrow: 4 } as const;

export const NARROW_QUERY = "(max-width: 767px)";

// Decorative terrain between regions.
export const TERRAIN_ICONS = [faMountain, faTree, faWater];

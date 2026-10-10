// What the ground is, as a pilot standing on it would call it.
export type SurfaceBiome =
  | "ocean"
  | "ice"
  | "desert"
  | "forest"
  | "grassland"
  | "rock"
  | "regolith"
  | "dust"
  | "basalt"
  | "sulfur"
  | "iceCrust"
  | "dunes"
  | "methaneSea"
  | "nitrogenIce"
  | "lava";

// The pad at home a new rocket stands on once a crew is back: what it is called, where it is (degrees north and
// east), and the land round it.
export interface HomePad {
  name: string;
  latitude: number;
  longitude: number;
  ground: "scrub" | "flats" | "hills";
}

// Where the ship stands on a world: which one (its id), the spot (degrees north and east), the local solar time
// (hours), what the ground is, and whether it is home, where a capsule comes down and a new rocket waits (and once
// it does, the pad it waits on).
export interface SurfaceInfo {
  body: string;
  pad: string | null;
  // The name a universe gave a world it made, null for ours.
  name: string | null;
  isHome: boolean;
  latitude: number;
  longitude: number;
  hours: number;
  biome: SurfaceBiome;
}

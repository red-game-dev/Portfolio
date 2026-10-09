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

// Where the ship stands on a world: which one (its id), the spot (degrees north and east), the local solar time
// (hours), and what the ground is.
export interface SurfaceInfo {
  body: string;
  latitude: number;
  longitude: number;
  hours: number;
  biome: SurfaceBiome;
}

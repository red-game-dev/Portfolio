import type { GlobeLook, StarLook } from "@/packages/graphics/globe";

import { StarSystem } from "./content";
import { VoyageStyle } from "./theme";

// What a star can be: from a cool red dwarf to a blue giant, a swollen red giant, or a dead white dwarf or
// neutron star. Each has its colour, size, brightness and pull.
export type StarKind = "red" | "orange" | "yellow" | "white" | "blue" | "giant" | "whiteDwarf" | "neutron";

// How a faction meets a stranger: on sight, near home, only once struck, or never.
export type Disposition = "hostile" | "territorial" | "neutral" | "peaceful";

// The shape of a faction's ships, each drawn its own way.
export type HullShape = "saucer" | "insect" | "crystal" | "organic" | "monolith" | "swarm";

export type WeaponKind = "cannon" | "laser" | "missile" | "spit" | "photoid";

export interface FactionSpec {
  id: number;
  name: string;
  disposition: Disposition;
  shape: HullShape;
  // Hull, trim and glow.
  colours: [string, string, string];
  weapon: WeaponKind;
  level: number;
  // How many fly together, how fast, how near a stranger must come to be noticed, and how far they will chase
  // from home before they give up and go back (world units).
  pack: number;
  speed: number;
  aggroRadius: number;
  leashRadius: number;
  hull: number;
  shields: number;
}

// The strange things a universe can hold.
export type PhenomenonKind =
  | "nebula"
  | "pulsar"
  | "magnetar"
  | "supernova"
  | "gammaBurst"
  | "darkForest"
  | "wormholes"
  | "quasar"
  | "whales";

export interface PhenomenonSpec {
  kind: PhenomenonKind;
  x: number;
  y: number;
  // A second point, for the far mouth of a wormhole or the direction of a beam.
  toX: number;
  toY: number;
  radius: number;
  strength: number;
  seed: number;
}

// One universe, all of it decided by its seed: what it is called and looks like, its star (or none), its worlds,
// who lives there, the strange things in it, and how dangerous it is.
export interface UniverseSpec {
  index: number;
  seed: number;
  name: string;
  style: VoyageStyle;
  accent: string;
  deep: string;
  hazard: string;
  starKind: StarKind | null;
  starLook: StarLook | null;
  system: StarSystem;
  looks: Record<string, GlobeLook>;
  // What its star and worlds are called, by id.
  names: Record<string, string>;
  factions: FactionSpec[];
  phenomena: PhenomenonSpec[];
  danger: number;
}

// Syllables a universe's and a faction's names are made from, and the words a faction calls itself by its
// manner. Content, from the host.
export interface UniverseNames {
  starts: string[];
  middles: string[];
  places: string[];
  factions: Record<Disposition, string[]>;
}

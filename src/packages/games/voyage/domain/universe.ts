import type { GlobeLook, StarLook } from "@/packages/graphics/globe";

import { StarSystem } from "./content";
import { VoyageStyle } from "./theme";

// What a star can be, as astronomers class them: a brown dwarf too small to shine by fusion, the dwarfs of the main
// sequence from cool red to hot blue, a red giant (`giant`), the supergiants (blue like Rigel, red like Betelgeuse)
// and the hypergiants beyond them (VY Canis Majoris), a Wolf-Rayet star blowing itself apart, or what stars leave
// behind: a white dwarf or a neutron star. Each has its colour, size, brightness and mass.
export type StarKind =
  | "brownDwarf"
  | "red"
  | "orange"
  | "yellow"
  | "white"
  | "blue"
  | "giant"
  | "blueSupergiant"
  | "redSupergiant"
  | "hypergiant"
  | "wolfRayet"
  | "whiteDwarf"
  | "neutron";

// The kinds of planet found round other stars, each a real class with members we know of: an iron world stripped to
// its core, a lava world, a carbon world of graphite and diamond, bare rock, a cratered moon of a world, a desert, an
// Earth-like terran world, a super-Earth, an ocean world, an eyeball world locked with one face to a red dwarf, a
// toxic Venus, a hazy Titan, an ice world, a volcanic Io, a mini-Neptune, an ice giant, a gas giant, a hot Jupiter,
// a super-puff, a chthonian core left when a giant's air was boiled away, and a rogue with no star at all.
export type WorldClass =
  | "iron"
  | "lava"
  | "carbon"
  | "rocky"
  | "cratered"
  | "desert"
  | "terran"
  | "superEarth"
  | "ocean"
  | "eyeball"
  | "toxic"
  | "haze"
  | "icy"
  | "volcanic"
  | "miniNeptune"
  | "iceGiant"
  | "gas"
  | "hotJupiter"
  | "puffy"
  | "chthonian"
  | "rogue";

// How many stars a system has, and how they are arranged: one alone; a close pair that its worlds circle together,
// as Kepler-16 b circles its two suns; a wide pair, its worlds circling one star while the other keeps far out, as
// round Alpha Centauri; or a close pair with a third far out, as Proxima Centauri is to Alpha Centauri's pair.
export type Multiplicity = "single" | "close" | "wide" | "triple";

// The kinds of galaxy a universe can sit in, as Hubble sorted them: a spiral, a barred spiral like our own, an
// elliptical of old stars, an irregular cloud, a dwarf, a ring.
export type GalaxyKind = "spiral" | "barred" | "elliptical" | "irregular" | "dwarf" | "ring";

// The galaxy round a universe: its kind, its own colours (young blue arms, an old gold core), how its disc lies in
// the sky (radians), how many arms it has, and a seed for its shape.
export interface GalaxySpec {
  kind: GalaxyKind;
  core: string;
  arms: string;
  tilt: number;
  armCount: number;
  seed: number;
}

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

// A universe so large it is a maze: star systems joined by gates in a web with dead ends and loops, the way on to
// the next universe waiting in only one. Each system's links (by place in the network), its star's name, and
// where it sits on the map (0 to 1 across and down); where the ship comes in, and the system with the way on.
export interface NetworkNode {
  links: number[];
  name: string;
  x: number;
  y: number;
}

export interface UniverseNetwork {
  nodes: NetworkNode[];
  start: number;
  exit: number;
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
  // The stars it shares the system with, in the order of `system.companions`, and how they are arranged.
  multiplicity: Multiplicity;
  companionKinds: StarKind[];
  companionLooks: StarLook[];
  galaxy: GalaxySpec;
  system: StarSystem;
  looks: Record<string, GlobeLook>;
  // What kind of world each of its worlds (and moons) is, by id.
  classes: Record<string, WorldClass>;
  // What its star and worlds are called, by id.
  names: Record<string, string>;
  factions: FactionSpec[];
  phenomena: PhenomenonSpec[];
  danger: number;
  // Which of its worlds are lived on, and by which faction (by id): only worlds life could arise on.
  inhabitants: Record<string, number>;
  // The maze it is part of, and which of its systems this is; null and 0 for a universe of one system.
  network: UniverseNetwork | null;
  node: number;
}

// Syllables a universe's and a faction's names are made from, and the words a faction calls itself by its
// manner. Content, from the host.
export interface UniverseNames {
  starts: string[];
  middles: string[];
  places: string[];
  factions: Record<Disposition, string[]>;
  // A system's belt of rocks, named for its star: "{star}" is replaced.
  belt: string;
}

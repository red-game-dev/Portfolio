import { BoostId } from "./boosts";
import { Loot } from "./loot";

// Position, velocity and size: everything that moves and collides. `prevX` and `prevY` hold the position one
// step back, so the renderer can draw between steps.
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  radius: number;
  mass: number;
}

export interface Spin {
  angle: number;
  rate: number;
}

// The ship's own state beyond its body: where it points, what its engines are doing, its fuel and how hot its
// hull is.
export interface Ship {
  angle: number;
  prevAngle: number;
  // 0 to 1, what the engines burned last step, for the flame and the fuel.
  thrust: number;
  isBraking: boolean;
  fuel: number;
  maxFuel: number;
  // The hull's temperature in Celsius, from sunlight, air and entry, and the hottest it has been.
  temperatureC: number;
  // The body it is resting on, if landed, and where on it, from its centre.
  landedOn: string | null;
  landedOffset: { x: number; y: number } | null;
}

// The systems that keep a ship flying, each from 0 (gone) to 1 (sound). Each has a temperature it was built for
// (see `ThermalConfig`); past it, it starts to fail.
export type ModuleId = "hull" | "engines" | "shields" | "sensors" | "fuel" | "radiators";

export const MODULE_IDS: readonly ModuleId[] = ["hull", "engines", "shields", "sensors", "fuel", "radiators"];

export type Modules = Record<ModuleId, number>;

// A mark left where the hull was hit, in the ship's own frame: the angle round it (0 is the nose, clockwise),
// how bad, and what kind, which grows from a dent to a scorch to a breach as the hull fails.
export interface Decal {
  angle: number;
  severity: number;
  kind: "dent" | "scorch" | "breach";
  seed: number;
}

// Shields take hits first and come back after a pause; the hull does not come back on its own.
export interface Health {
  hull: number;
  maxHull: number;
  shields: number;
  maxShields: number;
  // ms until the shields start to recharge.
  rechargeIn: number;
  decals: Decal[];
}

export interface Hazard {
  // Which drawn variant it is.
  shape: number;
  isIcy: boolean;
  // A comet: an icy rock whose tails grow as it nears the star.
  isComet: boolean;
}

export type PickupKind = "coin" | "shield" | "fuel" | "repair" | "boost" | "cache" | "chest";

// Something to pick up, and for a boost core, which boost.
export interface Pickup {
  kind: PickupKind;
  boost?: BoostId;
}

// Someone who lives in a universe: which faction, what part they play, what they are doing, where home is, how
// much they want the player dead (MMO threat, which damage raises and leashing clears), where they face, their
// level, and a boss's phase.
export type AlienRole = "fighter" | "boss" | "trader" | "whale";

export type AlienMode = "idle" | "chase" | "flee" | "evade";

export interface Alien {
  faction: number;
  role: AlienRole;
  mode: AlienMode;
  homeX: number;
  homeY: number;
  threat: number;
  angle: number;
  level: number;
  phase: number;
  // Until when an EMP holds it still and silent (ms on the run's clock).
  stunnedUntil?: number;
}

// A gun: what it fires, how hard, how often (shots a second), how far, how fast its shots fly, how much heat each
// shot adds to the hull, and how long until it can fire again (seconds).
export interface Weapon {
  kind: "cannon" | "laser" | "missile" | "spit" | "photoid" | "mine" | "flak" | "backup" | "rail" | "emp";
  damage: number;
  rate: number;
  range: number;
  speed: number;
  heat: number;
  cooldown: number;
}

// A shot in flight: who fired it and for which side, what it does, how long it has left, and what a missile
// homes on.
export interface Projectile {
  owner: number;
  team: "ship" | "aliens";
  kind: Weapon["kind"];
  damage: number;
  // The ship's shots: the piece that fired it (null for the main gun), whether it is a critical hit, a burst's
  // radius on impact, and for a mine when it arms (ms on the run's clock) and how near something must come.
  source?: string | null;
  isCrit?: boolean;
  blast?: number;
  armAt?: number;
  trigger?: number;
  ttl: number;
  target: number | null;
}

// A rock on its way to hit a world: which, how strong it still is, its real size (km), and whether it is a
// piece of one already broken.
export interface Impactor {
  target: string;
  hp: number;
  maxHp: number;
  diameterKm: number;
  isFragment: boolean;
  isOnCourse: boolean;
}

// Someone passing through: a rocket or starship of ours, or a freighter of a faction that lives here.
export interface Traffic {
  kind: "rocket" | "starship" | "freighter";
  faction: number;
}

// Something drifting dead: a lost probe, a rocket or a starship of ours, the hulk of one who lived here, or the
// ore and ice left where a rock or a comet was shot apart. What it still holds, how far salvaging it has got
// (0 to 1), how long a full salvage takes (seconds), whether it has been stripped, a seed for its look, and the
// faction of the fallen.
export type WreckKind = "probe" | "rocket" | "starship" | "alien" | "ore" | "ice";

export interface Wreck {
  kind: WreckKind;
  loot: Loot;
  progress: number;
  seconds: number;
  isEmpty: boolean;
  seed: number;
  faction: number;
}

// A gate between the star systems of a maze universe: the system (by its place in the network) it leads to.
export interface Gate {
  to: number;
}

// A black hole: its mass in Suns, its pull, its event horizon (world units), which grows in step with its mass as a
// real one's does, and whether it is the one past Pluto.
export interface Hole {
  mass: number;
  mu: number;
  horizon: number;
  isSingularity: boolean;
}

import { Rarity } from "../../economy/domain/items";

// Every piece of the ship that can be fitted, as an MMO's character sheet lists them: the cockpit, the armour
// plating, the engines, the wings, the shield generator, the sensors, the tank, the radiators and the main gun,
// then pieces a greater ship grows (thruster pods, a reactor, a warp drive, a halo ring).
export type GearSlot =
  | "cockpit"
  | "armor"
  | "engines"
  | "wings"
  | "shield"
  | "sensors"
  | "tank"
  | "radiators"
  | "primary"
  | "pods"
  | "reactor"
  | "drive"
  | "halo";

// The weapons fired from the ability bar: homing missiles, mines dropped behind, a railgun that pierces along the
// nose, an EMP that strips shields and stuns, and flak that fills the space ahead with shrapnel.
export type WeaponKind = "missile" | "mine" | "railgun" | "emp" | "flak";

// What each gun fires: rounds for the main gun, and one kind for each weapon.
export type AmmoType = "rounds" | "missiles" | "mines" | "slugs" | "cells" | "shells";

export type AmmoStock = Record<AmmoType, number>;

// What a piece adds to the ship, each a share over what the hull alone gives (0.08 is eight per cent more); `crit`
// is a chance of a hit doing double, and `resist` a share of every hit turned away.
export type GearStat =
  | "hull"
  | "plating"
  | "pressure"
  | "shields"
  | "regen"
  | "thrust"
  | "speed"
  | "turn"
  | "fuel"
  | "economy"
  | "heat"
  | "sensors"
  | "damage"
  | "rate"
  | "range"
  | "crit"
  | "magnet"
  | "resist";

export type GearStats = Partial<Record<GearStat, number>>;

// A slot: what it adds at its first grade, and when a ship grows it, by its form (0 to 29) and the pilot's level.
export interface SlotSpec {
  stats: GearStats;
  form: number;
  pilotLevel: number;
}

// A weapon at its first grade: what one shot does, how often it fires (a second), how fast and far it flies, what
// it fires and how many a shot takes; a blast's radius, how many pellets, their spread, a stun's seconds and how
// hard a missile turns, where the weapon has them.
export interface WeaponSpec {
  damage: number;
  rate: number;
  speed: number;
  range: number;
  ammo: AmmoType;
  perShot: number;
  blast: number;
  pellets: number;
  spread: number;
  stun: number;
  turn: number;
  pierce: boolean;
}

// A kind of piece: which slot it fits (or a weapon, which goes on the bar), its grade (0 to 5, one for each hull),
// and for a weapon which.
export interface GearBase {
  id: string;
  slot: GearSlot | "weapon";
  grade: number;
  weapon: WeaponKind | null;
}

// One piece the pilot owns, its own: which kind, how rare, the experience it has gained in use, and how far it has
// been enhanced.
export interface GearPiece {
  uid: string;
  base: string;
  rarity: Rarity;
  exp: number;
  enhance: number;
}

// A piece found or made, before it is the pilot's.
export interface GearDrop {
  base: string;
  rarity: Rarity;
}

// The armoury kept between runs: every piece owned, which is fitted in each slot, the ammunition in the racks, and
// the next piece's number.
export interface ArmoryProfile {
  gear: GearPiece[];
  equipped: Partial<Record<GearSlot, string>>;
  ammo: AmmoStock;
  nextUid: number;
}

// A weapon as the run fires it: its piece, its kind, and its numbers with everything that grows it applied.
export interface ArmedWeapon extends WeaponSpec {
  uid: string;
  kind: WeaponKind;
}

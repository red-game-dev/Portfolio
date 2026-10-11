import { WeaponKind, WeaponSpec } from "../domain/gear";

export const WEAPON_KINDS: readonly WeaponKind[] = ["missile", "mine", "railgun", "emp", "flak"];

const weapon = (spec: Partial<WeaponSpec> & Pick<WeaponSpec, "damage" | "rate" | "speed" | "range" | "ammo">): WeaponSpec => ({
  perShot: 1,
  blast: 0,
  pellets: 1,
  spread: 0,
  stun: 0,
  turn: 0,
  pierce: false,
  ...spec,
});

// Each weapon at its first grade:
// - missile: homes on its target and bursts on it;
// - mine: dropped behind, armed after a moment, it bursts when anything hostile comes near and lasts a while;
// - railgun: a slug fast enough to cross the screen at once, through everything in its line;
// - emp: a pulse round the ship that strips shields, stuns everyone in reach and kills missiles in flight;
// - flak: a fan of pellets, short and wide, for rocks and missiles closing in.
export const WEAPON_SPECS: Readonly<Record<WeaponKind, WeaponSpec>> = {
  missile: weapon({ damage: 90, rate: 0.9, speed: 4.2, range: 9, ammo: "missiles", blast: 0.3, turn: 3 }),
  mine: weapon({ damage: 170, rate: 0.7, speed: 0, range: 0.35, ammo: "mines", blast: 0.55 }),
  railgun: weapon({ damage: 240, rate: 0.4, speed: 40, range: 16, ammo: "slugs", pierce: true }),
  emp: weapon({ damage: 25, rate: 0.2, speed: 0, range: 3.2, ammo: "cells", stun: 2.5 }),
  flak: weapon({ damage: 16, rate: 1.3, speed: 9, range: 4.5, ammo: "shells", pellets: 8, spread: 0.5 }),
};

// Each weapon's colour on the bar and in the armoury.
export const WEAPON_COLOURS: Readonly<Record<WeaponKind, string>> = { missile: "#ff9a5c", mine: "#ff5c6c", railgun: "#7df9ff", emp: "#78c8ff", flak: "#ffd27a" };

// A mine is armed this long after it drops (seconds), and lasts this long (seconds).
export const MINE_ARM = 0.6;
export const MINE_LIFE = 25;

import { EnhanceLadder } from "@/packages/progression/enhancement";
import { LevelCurve } from "@/packages/progression/levels";

import { ENHANCE_COIN, ENHANCE_COIN_GROWTH, ENHANCE_MATERIALS, ENHANCE_TIERS } from "../config/enhance";
import { GEAR_CURVE } from "../config/levels";
import { AMMO_RACKS, GEAR_SLOTS, GEAR_STATS, GRADE_SCALE, GRADES, LEVEL_POWER, RARITY_POWER, SLOT_SPECS, STAT_CAPS } from "../config/slots";
import { WEAPON_KINDS, WEAPON_SPECS } from "../config/weapons";
import { AmmoType, ArmedWeapon, GearBase, GearPiece, GearSlot, GearStats, WeaponKind } from "../domain/gear";

// The one ladder every piece climbs, and the one curve its levels follow.
export const ENHANCE_LADDER = new EnhanceLadder(ENHANCE_TIERS);
export const GEAR_LEVELS = new LevelCurve(GEAR_CURVE);

const isSlot = (value: string): value is GearSlot => GEAR_SLOTS.some((slot) => slot === value);

export const isWeaponKind = (value: string): value is WeaponKind => WEAPON_KINDS.some((kind) => kind === value);

const isGrade = (value: number) => Number.isInteger(value) && value >= 0 && value < GRADES;

export const slotBaseId = (slot: GearSlot, grade: number): string => `${slot}:${grade}`;

export const weaponBaseId = (kind: WeaponKind, grade: number): string => `weapon:${kind}:${grade}`;

const slotBase = (slot: GearSlot, grade: number): GearBase => ({ id: slotBaseId(slot, grade), slot, grade, weapon: null });

const weaponBase = (kind: WeaponKind, grade: number): GearBase => ({ id: weaponBaseId(kind, grade), slot: "weapon", grade, weapon: kind });

// A kind of piece read from its id ("armor:2", "weapon:missile:3"), or null for one there is no such thing as.
export const baseOf = (id: string): GearBase | null => {
  const [first, second, third] = id.split(":");

  if (first === "weapon" && third !== undefined && isWeaponKind(second) && isGrade(Number(third))) {
    return weaponBase(second, Number(third));
  }

  return second !== undefined && third === undefined && isSlot(first) && isGrade(Number(second)) ? slotBase(first, Number(second)) : null;
};

// Every kind of piece there is: each slot and each weapon in every grade.
export const GEAR_BASES: readonly GearBase[] = [
  ...GEAR_SLOTS.flatMap((slot) => GRADE_SCALE.map((_, grade) => slotBase(slot, grade))),
  ...WEAPON_KINDS.flatMap((kind) => GRADE_SCALE.map((_, grade) => weaponBase(kind, grade))),
];

export const pieceLevel = (piece: Pick<GearPiece, "exp">): number => GEAR_LEVELS.levelOf(piece.exp);

// How much stronger a piece is than the first grade of its kind: its grade, its rarity, its level and its steps of
// enhancement, each multiplying the others.
export const piecePower = (piece: GearPiece): number => {
  const base = baseOf(piece.base);

  return base ? GRADE_SCALE[base.grade] * RARITY_POWER[piece.rarity] * (1 + LEVEL_POWER * (pieceLevel(piece) - 1)) * (1 + ENHANCE_LADDER.bonusAt(piece.enhance)) : 0;
};

// What a fitted piece adds to the ship; a weapon adds nothing here, since it is fired from the bar.
export const pieceStats = (piece: GearPiece): GearStats => {
  const base = baseOf(piece.base);
  const stats: GearStats = {};

  if (!base || base.slot === "weapon") {
    return stats;
  }

  const power = piecePower(piece);
  const spec = SLOT_SPECS[base.slot].stats;

  for (const stat of GEAR_STATS) {
    const value = spec[stat];

    if (value) {
      stats[stat] = value * power;
    }
  }

  return stats;
};

// Everything the fitted pieces add together, a crit chance and the hits turned away held within their caps.
export const loadoutStats = (pieces: readonly GearPiece[]): GearStats => {
  const total: GearStats = {};

  pieces.forEach((piece) => {
    const stats = pieceStats(piece);

    for (const stat of GEAR_STATS) {
      const value = stats[stat];

      if (value) {
        total[stat] = (total[stat] ?? 0) + value;
      }
    }
  });

  total.crit = Math.min(STAT_CAPS.crit, total.crit ?? 0);
  total.resist = Math.min(STAT_CAPS.resist, total.resist ?? 0);

  return total;
};

// A weapon piece as the run fires it: its kind's numbers grown by its own power and the ship's damage and rate.
export const armedWeapon = (piece: GearPiece, ship: GearStats = {}): ArmedWeapon | null => {
  const base = baseOf(piece.base);

  if (!base?.weapon) {
    return null;
  }

  const spec = WEAPON_SPECS[base.weapon];
  const power = piecePower(piece);

  return {
    ...spec,
    uid: piece.uid,
    kind: base.weapon,
    damage: spec.damage * power * (1 + (ship.damage ?? 0)),
    rate: spec.rate * (1 + ENHANCE_LADDER.bonusAt(piece.enhance) * 0.3) * (1 + (ship.rate ?? 0) * 0.5),
    range: spec.range * (1 + (ship.range ?? 0) * 0.5),
  };
};

// Whether a slot is there yet on a ship of a form (0 to 29) flown by a pilot of a level.
export const isSlotOpen = (slot: GearSlot, form: number, pilotLevel: number): boolean => form >= SLOT_SPECS[slot].form && pilotLevel >= SLOT_SPECS[slot].pilotLevel;

// How much of each ammunition a hull's racks hold (the hull's place, 0 for the rocket).
export const rackFor = (type: AmmoType, hull: number): number => AMMO_RACKS[type].base + AMMO_RACKS[type].perHull * Math.max(0, hull);

// What an attempt to enhance from a step takes: Red Coin growing with every step, and the next step's tier's
// material, one more for every four steps into that tier; null at the top.
export const enhanceCost = (step: number): { coin: number; material: string; count: number } | null => {
  if (step >= ENHANCE_LADDER.top) {
    return null;
  }

  const next = ENHANCE_LADDER.formOf(step + 1);

  return {
    coin: Math.round((ENHANCE_COIN * ENHANCE_COIN_GROWTH ** step) / 5) * 5,
    material: ENHANCE_MATERIALS[next.tier ?? "moon"],
    count: 1 + Math.floor((next.count - 1) / 4),
  };
};

import type { EnhanceForm } from "@/packages/progression/enhancement";
import type { LevelStanding } from "@/packages/progression/levels";

import { Rarity } from "../../economy/domain/items";
import { AchievementSpec, PaintSpec, TrailSpec } from "../../progress/domain/progress";
import { AmmoType, ArmedWeapon, GearSlot, GearStats, WeaponKind } from "./gear";

// A piece as the ship's sheet shows it: what it is, its level and how far into the next, its enhancement and how it
// reads, what the next attempt costs and its chance, what it adds (or as a weapon, what it fires), whether it is
// fitted or on the bar, whether the pilot is level enough for it, and what it brings broken down.
export interface PieceView {
  uid: string;
  base: string;
  slot: GearSlot | "weapon";
  weapon: WeaponKind | null;
  grade: number;
  rarity: Rarity;
  level: number;
  levelShare: number;
  enhance: number;
  form: EnhanceForm;
  next: { coin: number; material: string; count: number; chance: number; fall: number; have: number } | null;
  stats: GearStats;
  armed: ArmedWeapon | null;
  isFitted: boolean;
  isOnBar: boolean;
  canFit: boolean;
  gradeLevel: number;
  value: number;
}

// A slot on the sheet: what is fitted there, and whether the ship has grown it yet (and what it waits for).
export interface SlotView {
  slot: GearSlot;
  uid: string | null;
  isOpen: boolean;
  form: number;
  pilotLevel: number;
}

// A weapon that can be forged: whether its plan is known, and each grade's cost and whether it can be met now.
export interface ForgeView {
  kind: WeaponKind;
  isKnown: boolean;
  grades: Array<{ grade: number; coin: number; items: Array<{ id: string; count: number; have: number }>; pilotLevel: number; isReady: boolean }>;
}

// The armoury as the UI shows it: every piece, every slot, the racks, what the fittings add, the ship's form, and
// the weapons that can be forged.
export interface ArmoryView {
  pieces: PieceView[];
  slots: SlotView[];
  ammo: Array<{ type: AmmoType; count: number; rack: number }>;
  stats: GearStats;
  form: number;
  forge: ForgeView[];
  stabilisers: number;
}

// The pilot's progress as the UI shows it: their level and how far into the next, the stars won, every achievement
// with how near it is, and the paints and trails with which are owned and worn.
export interface ProgressView {
  level: number;
  standing: LevelStanding;
  starTotal: number;
  stars: Record<string, number>;
  achievements: Array<{ spec: AchievementSpec; at: number | null; value: number }>;
  paints: Array<{ spec: PaintSpec; isOwned: boolean; isWorn: boolean; stars: number | null }>;
  trails: Array<{ spec: TrailSpec; isOwned: boolean; isWorn: boolean; stars: number | null }>;
  guide: { step: number; isDone: boolean };
}

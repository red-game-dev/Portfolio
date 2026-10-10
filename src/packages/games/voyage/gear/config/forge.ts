import { TIERS } from "../../economy/config/tiers";
import { TIER_MATERIALS } from "../../economy/config/upgrades";
import { ItemStack } from "../../economy/domain/items";
import { WeaponKind } from "../domain/gear";
import { GRADE_LEVEL, GRADE_SCALE, RARITY_POWER } from "./slots";

// The plan a weapon is forged from, by its kind, found in wrecks, caches, on bosses and in their chests.
export const weaponPlan = (kind: WeaponKind): string => `weapon:${kind}`;

// What forging a weapon of a grade takes: Red Coin growing with the grade, the materials of that grade's hull and
// circuits for its guidance; and the pilot's level the grade needs.
export const forgeCost = (grade: number): { coin: number; items: ItemStack[]; pilotLevel: number } => ({
  coin: Math.round((120 * 1.6 ** grade) / 5) * 5,
  items: [...TIER_MATERIALS[TIERS[Math.min(grade, TIERS.length - 1)]], { id: "circuits", count: 1 + grade }],
  pilotLevel: GRADE_LEVEL[grade] ?? 1,
});

// What a piece brings broken down: more for its grade, rarity and enhancement.
export const dismantleValue = (grade: number, rarity: keyof typeof RARITY_POWER, enhance: number): number =>
  Math.round(20 * (GRADE_SCALE[grade] ?? 1) * RARITY_POWER[rarity] * (1 + enhance * 0.25));

import { Guard, isArrayOf, isCount, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

import { RARITIES } from "../../economy/domain/items";
import { ArmoryProfile, GearPiece } from "../domain/gear";

const isPiece: Guard<GearPiece> = (value): value is GearPiece => isRecord(value) && isText(value.uid) && isText(value.base) &&
  RARITIES.some((rarity) => rarity === value.rarity) && isExp(value.exp) && isCount(value.enhance);

// A piece's experience: a whole number now, though a release once kept fractions, which are read back and rounded down.
const isExp = (value: unknown): boolean => isFiniteNumber(value) && value >= 0;

// Whether something read back is an armoury: pieces, fittings by slot, ammunition counts and the next number. Only
// the shape is checked: a piece of a kind no longer known, or a fitting that does not fit, is left out as it is read.
export const isArmoryProfile: Guard<ArmoryProfile> = (value): value is ArmoryProfile => isRecord(value) && isArrayOf(isPiece)(value.gear) &&
  isRecord(value.equipped) && Object.values(value.equipped).every(isText) && isRecord(value.ammo) && Object.values(value.ammo).every(isCount) &&
  isCount(value.nextUid);

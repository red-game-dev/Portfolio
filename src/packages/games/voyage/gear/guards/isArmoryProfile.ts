import { Guard, isArrayOf, isCount, isRecord, isText } from "@/packages/core/domain";

import { RARITIES } from "../../economy/domain/items";
import { ArmoryProfile, GearPiece } from "../domain/gear";

const isPiece: Guard<GearPiece> = (value): value is GearPiece => isRecord(value) && isText(value.uid) && isText(value.base) &&
  RARITIES.some((rarity) => rarity === value.rarity) && isCount(value.exp) && isCount(value.enhance);

// Whether something read back is an armoury: pieces, fittings by slot, ammunition counts and the next number. Only
// the shape is checked: a piece of a kind no longer known, or a fitting that does not fit, is left out as it is read.
export const isArmoryProfile: Guard<ArmoryProfile> = (value): value is ArmoryProfile => isRecord(value) && isArrayOf(isPiece)(value.gear) &&
  isRecord(value.equipped) && Object.values(value.equipped).every(isText) && isRecord(value.ammo) && Object.values(value.ammo).every(isCount) &&
  isCount(value.nextUid);

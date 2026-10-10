import { TIERS, tierOf } from "../../economy/config/tiers";
import { Hangar } from "../../economy/services/Hangar";
import { ACHIEVEMENTS } from "../../progress/config/achievements";
import { PAINTS, STAR_UNLOCKS, TRAILS } from "../../progress/config/cosmetics";
import { Progress } from "../../progress/services/Progress";
import { STABILISER } from "../config/enhance";
import { dismantleValue, forgeCost, weaponPlan } from "../config/forge";
import { AMMO_TYPES, GEAR_SLOTS, GRADE_LEVEL, SLOT_SPECS } from "../config/slots";
import { WEAPON_KINDS } from "../config/weapons";
import { ArmoryView, PieceView, ProgressView } from "../domain/view";
import { Armory } from "../services/Armory";
import { armedWeapon, baseOf, ENHANCE_LADDER, enhanceCost, GEAR_LEVELS, isSlotOpen, pieceStats, rackFor } from "./gear";

// The armoury as the sheet shows it, read with the hangar (the ship's form, the hold, the bar) and the pilot's level.
export const armoryView = (armory: Armory, hangar: Hangar, progress: Progress): ArmoryView => {
  const form = hangar.level;
  const hull = TIERS.indexOf(tierOf(form));
  const pilotLevel = progress.level;
  const onBar = new Set(hangar.view().bar.map((row) => (row.slot?.kind === "weapon" ? row.slot.id : null)));
  const fitted = new Set(GEAR_SLOTS.map((slot) => armory.fitted(slot)?.uid ?? null));
  const ship = armory.stats();
  const pieces = armory.pieces.map((piece): PieceView | null => {
    const base = baseOf(piece.base);

    if (!base) {
      return null;
    }

    const standing = GEAR_LEVELS.standing(piece.exp);
    const cost = enhanceCost(piece.enhance);

    return {
      uid: piece.uid,
      base: piece.base,
      slot: base.slot,
      weapon: base.weapon,
      grade: base.grade,
      rarity: piece.rarity,
      level: standing.level,
      levelShare: standing.share,
      enhance: piece.enhance,
      form: ENHANCE_LADDER.formOf(piece.enhance),
      next: cost ? { ...cost, chance: ENHANCE_LADDER.chanceFrom(piece.enhance), fall: ENHANCE_LADDER.fallFrom(piece.enhance), have: hangar.count(cost.material) } : null,
      stats: pieceStats(piece),
      armed: armedWeapon(piece, ship),
      isFitted: fitted.has(piece.uid),
      isOnBar: onBar.has(piece.uid),
      canFit: base.slot !== "weapon" && isSlotOpen(base.slot, form, pilotLevel) && pilotLevel >= GRADE_LEVEL[base.grade],
      gradeLevel: GRADE_LEVEL[base.grade],
      value: dismantleValue(base.grade, piece.rarity, piece.enhance),
    };
  }).filter((view): view is PieceView => view !== null);

  return {
    pieces,
    slots: GEAR_SLOTS.map((slot) => ({
      slot,
      uid: armory.fitted(slot)?.uid ?? null,
      isOpen: isSlotOpen(slot, form, pilotLevel),
      form: SLOT_SPECS[slot].form,
      pilotLevel: SLOT_SPECS[slot].pilotLevel,
    })),
    ammo: AMMO_TYPES.map((type) => ({ type, count: armory.ammoOf(type), rack: rackFor(type, hull) })),
    stats: ship,
    form,
    forge: WEAPON_KINDS.map((kind) => ({
      kind,
      isKnown: hangar.knows(weaponPlan(kind)),
      grades: GRADE_LEVEL.map((_, grade) => {
        const cost = forgeCost(grade);
        const items = cost.items.map(({ id, count }) => ({ id, count, have: hangar.count(id) }));

        return {
          grade,
          coin: cost.coin,
          items,
          pilotLevel: cost.pilotLevel,
          isReady: hangar.knows(weaponPlan(kind)) && pilotLevel >= cost.pilotLevel && hangar.purse.RED >= cost.coin && items.every((item) => item.have >= item.count),
        };
      }).filter(({ grade }) => grade <= hull),
    })),
    stabilisers: hangar.count(STABILISER),
  };
};

// The pilot's progress as the UI shows it.
export const progressView = (progress: Progress): ProgressView => {
  const starsFor = (id: string) => STAR_UNLOCKS.find((unlock) => unlock.cosmetic === id)?.stars ?? null;
  const profile = progress.toProfile();

  return {
    level: progress.level,
    standing: progress.standing,
    starTotal: progress.starTotal,
    stars: profile.stars,
    achievements: ACHIEVEMENTS.map((spec) => ({ spec, at: profile.achievements[spec.id] ?? null, value: progress.counter(spec.counter) })),
    paints: PAINTS.map((spec) => ({ spec, isOwned: progress.owns(spec.id), isWorn: progress.paint === spec.id, stars: starsFor(spec.id) })),
    trails: TRAILS.map((spec) => ({ spec, isOwned: progress.owns(spec.id), isWorn: progress.trail === spec.id, stars: starsFor(spec.id) })),
    guide: profile.guide,
  };
};

import type { RandomSource } from "@/packages/math/random";
import type { EnhanceResult } from "@/packages/progression/enhancement";

import type { WeaponPort } from "../../economy/services/Hangar";
import { STABILISER } from "../config/enhance";
import { AMMO_TYPES, GEAR_SLOTS, STARTER_AMMO, STOCK_SLOTS } from "../config/slots";
import { WEAPON_COLOURS, WEAPON_SPECS } from "../config/weapons";
import { AmmoStock, AmmoType, ArmedWeapon, ArmoryProfile, GearDrop, GearPiece, GearSlot, GearStats } from "../domain/gear";
import { armedWeapon, baseOf, ENHANCE_LADDER, enhanceCost, GEAR_LEVELS, isSlotOpen, loadoutStats, pieceLevel, slotBaseId } from "../utils/gear";

// What an attempt to enhance costs, handed to whoever holds the money and the hold to take it: Red Coin, a tier's
// material and, to keep a failure from falling, a stabiliser. Answers whether it was paid.
export type EnhancePayment = (cost: { coin: number; items: Array<{ id: string; count: number }> }) => boolean;

// A new pilot's armoury: the rocket's stock pieces fitted, and the main gun's rounds.
export const newArmoryProfile = (): ArmoryProfile => {
  const gear = STOCK_SLOTS.map((slot, index): GearPiece => ({ uid: `g${index + 1}`, base: slotBaseId(slot, 0), rarity: "common", exp: 0, enhance: 0 }));

  return {
    gear,
    equipped: Object.fromEntries(STOCK_SLOTS.map((slot, index) => [slot, gear[index].uid])),
    ammo: { ...STARTER_AMMO },
    nextUid: gear.length + 1,
  };
};

// The pilot's gear between and during runs: every piece owned, which is fitted in each slot, how each one levels
// with use and climbs the enhancement ladder, and the ammunition in the racks. It never touches a run: what the
// fittings add comes out as stats for the ship's config, and the weapons as armed weapons for the run to fire.
// Listeners hear every change, to save it and show it.
export class Armory {
  private gear: Map<string, GearPiece>;
  private equipped: Partial<Record<GearSlot, string>>;
  private ammo: AmmoStock;
  private nextUid: number;
  private readonly listeners = new Set<() => void>();
  // What the fittings add, worked out once per change.
  private cached: GearStats | null = null;

  constructor(profile: ArmoryProfile = newArmoryProfile()) {
    this.gear = new Map();
    this.equipped = {};
    this.ammo = { ...STARTER_AMMO };
    this.nextUid = 1;
    this.take(profile);
  }

  public get pieces(): GearPiece[] {
    return [...this.gear.values()];
  }

  // The ammunition in the racks.
  public get stock(): AmmoStock {
    return { ...this.ammo };
  }

  public piece(uid: string): GearPiece | null {
    return this.gear.get(uid) ?? null;
  }

  public fitted(slot: GearSlot): GearPiece | null {
    const uid = this.equipped[slot];

    return uid ? this.gear.get(uid) ?? null : null;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  // Takes on a profile written elsewhere (another tab's newer save, or a reset).
  public replace(profile: ArmoryProfile): void {
    this.take(profile);
    this.changed();
  }

  // A piece found or made becomes the pilot's.
  public add(drop: GearDrop): GearPiece | null {
    if (!baseOf(drop.base)) {
      return null;
    }

    const piece: GearPiece = { uid: `g${this.nextUid}`, base: drop.base, rarity: drop.rarity, exp: 0, enhance: 0 };

    this.nextUid += 1;
    this.gear.set(piece.uid, piece);
    this.changed();

    return piece;
  }

  // Fits a piece in its slot, if the ship has that slot yet (by its form and the pilot's level) and the pilot is
  // level enough for its grade; what was there goes back to the armoury. Weapons go on the bar instead.
  public equip(uid: string, form: number, pilotLevel: number, gradeLevel: (grade: number) => number): boolean {
    const piece = this.gear.get(uid);
    const base = piece ? baseOf(piece.base) : null;

    if (!base || base.slot === "weapon" || !isSlotOpen(base.slot, form, pilotLevel) || pilotLevel < gradeLevel(base.grade)) {
      return false;
    }

    this.equipped[base.slot] = uid;
    this.changed();

    return true;
  }

  public unequip(slot: GearSlot): boolean {
    if (!this.equipped[slot]) {
      return false;
    }

    delete this.equipped[slot];
    this.changed();

    return true;
  }

  // Lets a piece go for good (not one fitted); returns it, so the host can pay what it was worth.
  public dismantle(uid: string): GearPiece | null {
    const piece = this.gear.get(uid);

    if (!piece || Object.values(this.equipped).includes(uid)) {
      return null;
    }

    this.gear.delete(uid);
    this.changed();

    return piece;
  }

  // Experience for a piece from its use; returns how many levels it gained.
  public gainExp(uid: string, amount: number): number {
    const piece = this.gear.get(uid);

    if (!piece || amount <= 0) {
      return 0;
    }

    const before = pieceLevel(piece);

    piece.exp = Math.min(GEAR_LEVELS.startOf(GEAR_LEVELS.cap), piece.exp + amount);

    const gained = pieceLevel(piece) - before;

    // A level changes what the piece adds; experience alone changes nothing anyone sees until it does.
    if (gained > 0) {
      this.changed();
    }

    return gained;
  }

  // Experience for every fitted piece at once (a share of what the pilot earns).
  public gainFittedExp(amount: number): number {
    return GEAR_SLOTS.reduce((gained, slot) => {
      const uid = this.equipped[slot];

      return uid ? gained + this.gainExp(uid, amount) : gained;
    }, 0);
  }

  // One attempt to enhance a piece: paid first (Red Coin, the material and, if asked, a stabiliser), then decided by
  // one draw. Null when it is at the top or could not be paid.
  public enhance(uid: string, pay: EnhancePayment, random: RandomSource, isProtected = false): EnhanceResult | null {
    const piece = this.gear.get(uid);
    const cost = piece ? enhanceCost(piece.enhance) : null;

    if (!piece || !cost) {
      return null;
    }

    const items = [{ id: cost.material, count: cost.count }, ...(isProtected ? [{ id: STABILISER, count: 1 }] : [])];

    if (!pay({ coin: cost.coin, items })) {
      return null;
    }

    const result = ENHANCE_LADDER.attempt(piece.enhance, random, isProtected);

    piece.enhance = result.to;
    this.changed();

    return result;
  }

  public ammoOf(type: AmmoType): number {
    return this.ammo[type];
  }

  // Ammunition put in the racks, each kind up to what the racks hold (`rack` by kind); returns what fitted.
  public addAmmo(found: Partial<AmmoStock>, rack: (type: AmmoType) => number): Partial<AmmoStock> {
    const added: Partial<AmmoStock> = {};

    AMMO_TYPES.forEach((type) => {
      const count = Math.max(0, Math.floor(found[type] ?? 0));
      const room = Math.max(0, rack(type) - this.ammo[type]);
      const fits = Math.min(count, room);

      if (fits > 0) {
        this.ammo[type] += fits;
        added[type] = fits;
      }
    });

    if (Object.keys(added).length > 0) {
      this.changed();
    }

    return added;
  }

  // Ammunition fired in a run. Shots come many a second, so this tells no one: the run's own count is what shows.
  public spendAmmo(type: AmmoType, count = 1): void {
    this.ammo[type] = Math.max(0, this.ammo[type] - count);
  }

  // What the fitted pieces add to the ship.
  public stats(): GearStats {
    this.cached ??= loadoutStats(GEAR_SLOTS.map((slot) => this.fitted(slot)).filter((piece): piece is GearPiece => piece !== null));

    return this.cached;
  }

  // A weapon piece as the run fires it, grown by the ship's fittings.
  public armed(uid: string): ArmedWeapon | null {
    const piece = this.gear.get(uid);

    return piece ? armedWeapon(piece, this.stats()) : null;
  }

  // What the bar needs to know of the armoury: whether a piece is a weapon owned, and its slot's shots left (the
  // racks of its ammunition), level and colour.
  public port(): WeaponPort {
    return {
      has: (uid) => baseOf(this.gear.get(uid)?.base ?? "")?.slot === "weapon",
      describe: (uid) => {
        const piece = this.gear.get(uid);
        const kind = piece ? baseOf(piece.base)?.weapon : null;

        if (!piece || !kind) {
          return null;
        }

        return { count: Math.floor(this.ammo[WEAPON_SPECS[kind].ammo] / WEAPON_SPECS[kind].perShot), level: pieceLevel(piece), colour: WEAPON_COLOURS[kind] };
      },
    };
  }

  public toProfile(): ArmoryProfile {
    return {
      gear: this.pieces.map((piece) => ({ ...piece })),
      equipped: { ...this.equipped },
      ammo: { ...this.ammo },
      nextUid: this.nextUid,
    };
  }

  // Reads a profile in, leaving out any piece of a kind there is no longer such a thing as, and any fitting of a
  // piece not owned or in the wrong slot.
  private take(profile: ArmoryProfile): void {
    this.gear = new Map(profile.gear.filter((piece) => baseOf(piece.base) !== null).map((piece) => [piece.uid, { ...piece }]));
    this.equipped = {};
    GEAR_SLOTS.forEach((slot) => {
      const uid = profile.equipped[slot];
      const piece = uid ? this.gear.get(uid) : undefined;

      if (piece && baseOf(piece.base)?.slot === slot) {
        this.equipped[slot] = piece.uid;
      }
    });
    this.ammo = { ...STARTER_AMMO, ...profile.ammo };
    // Past every number already given, whatever the profile says, so no two pieces ever share one.
    this.nextUid = [...this.gear.keys()].reduce((next, uid) => Math.max(next, Number(uid.slice(1)) + 1 || next), Math.max(1, profile.nextUid));
    this.cached = null;
  }

  private changed(): void {
    this.cached = null;
    this.listeners.forEach((listener) => listener());
  }
}

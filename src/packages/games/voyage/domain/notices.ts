import type { EnhanceForm } from "@/packages/progression/enhancement";

import { HullTier, Purse, Deed } from "../economy/domain/economy";
import { BarSlot } from "../economy/domain/profile";
import type { AmmoStock, GearDrop, GearSlot, WeaponKind } from "../gear/domain/gear";
import type { LandingPhase } from "../landing";
import { BoostId } from "./boosts";
import { ModuleId, WreckKind } from "./components";
import { FlareClass, ImpactOutcome } from "./events";
import { FaultKind } from "./faults";
import { ItemStack } from "./loot";

export type SlotRefusal = "empty" | "cooling" | "unable" | "unneeded" | "noTarget";

// Something the UI may want to say, as it happens, beyond what the snapshot shows.
export type VoyageNotice =
  | { kind: "tookOff" | "emergency"; body: string }
  | { kind: "recovered"; body: string; days: number }
  // No fuel to leave (a world's name, or null adrift): the countdown begun, or over and the run with it; and rescued.
  | { kind: "stranded"; body: string | null; seconds: number; isRescue: boolean; isOver: boolean }
  | { kind: "rescued"; from: string | null; days: number }
  // Down in one piece at a speed (m/s), a phase of the way down beginning, or a touchdown too hard for the craft.
  | { kind: "landed"; body: string; speed: number | null }
  | { kind: "descent"; body: string; phase: LandingPhase }
  | { kind: "hardLanding"; body: string; speed: number; safe: number }
  | { kind: "captured"; isSingularity: boolean }
  | { kind: "destroyed" }
  | { kind: "flare"; flareClass: FlareClass; isHeading: boolean }
  // A storm reaching the ship, or turned aside by a magnetic shield.
  | { kind: "storm"; isTurned: boolean }
  | { kind: "failing"; module: ModuleId; isGone: boolean }
  | { kind: "melting"; temperatureC: number }
  | { kind: "impactAlert"; target: string; diameterKm: number; seconds: number }
  | { kind: "impact"; target: string; outcome: ImpactOutcome; craterKm: number }
  | { kind: "impactorBroken" | "deflected"; target: string }
  | { kind: "boss"; name: string; isFallen: boolean }
  | { kind: "heard" | "wormhole" }
  | { kind: "gate"; system: string; isNew: boolean; isExit: boolean; isDeadEnd: boolean }
  | { kind: "hosted" | "groundFire"; body: string; faction: string }
  | { kind: "supernova"; seconds: number; isBlown: boolean }
  | { kind: "burst"; seconds: number; isFired: boolean }
  | { kind: "salvaged"; wreck: WreckKind; kept: ItemStack[]; lost: ItemStack[]; blueprints: string[] }
  | { kind: "fault" | "fixed"; fault: FaultKind }
  // A boost's core picked up: its level and charges now, and whether it was the first or raised the level.
  | { kind: "boostFound"; boost: BoostId; level: number; charges: number; isFirst: boolean; isLevelUp: boolean }
  // A slot of the bar pressed for nothing: none left, still cooling down (for "{seconds}"), unable to work here, or
  // of no help now.
  | { kind: "slotRefused"; slot: BarSlot; reason: SlotRefusal; seconds: number; base?: string | null }
  // A cache or a boss's chest opened (what went in the hold), gear and ammunition found, a streak of kills, a new
  // level, stars won in a universe ("u:3") or a daily voyage ("d:2026-10-11"), an achievement, a paint or a trail.
  | { kind: "opened"; chest: boolean; kept: ItemStack[]; lost: ItemStack[]; blueprints: string[] }
  | { kind: "loot"; gear: GearDrop[]; ammo: Partial<AmmoStock> }
  | { kind: "streak"; count: number }
  | { kind: "levelUp"; level: number }
  | { kind: "stars"; key: string; stars: number; gained: number }
  | { kind: "achievement" | "cosmetic"; id: string }
  // An attempt to enhance a piece: what became of it.
  | { kind: "enhanced"; uid: string; base: string; outcome: "success" | "fell" | "kept"; step: number; form: EnhanceForm }
  | { kind: "upgraded"; level: number; tier: HullTier; mark: number }
  | { kind: "earned"; deed: Deed["kind"]; amounts: Purse }
  | { kind: "paid"; coin: number }
  // A mission done and what it paid, a promotion, something new in the codex, and a daily voyage's result.
  | { kind: "missionDone"; mission: string; xp: number; coin: number }
  | { kind: "promoted"; rank: string }
  | { kind: "discovered"; entry: string }
  | { kind: "daily"; day: string; score: number; isBest: boolean };

// What the pilot can ask of the hangar from the UI, each in one click.
export type VoyageAction =
  | { kind: "upgrade" }
  | { kind: "craft"; recipe: string }
  | { kind: "recycle"; item: string; count: number }
  | { kind: "use"; item: string }
  // What sits in a slot of the ability bar used, and a slot filled or emptied.
  | { kind: "slot"; index: number }
  | { kind: "setSlot"; index: number; slot: BarSlot | null }
  | { kind: "repair"; fault: number }
  | { kind: "trade"; direction: "sell" | "buy" }
  // The armoury: a piece fitted or a slot emptied, an attempt to enhance (with a stabiliser to keep a failure from
  // falling), a piece broken down for Red Coin, a weapon forged from its plan at a grade.
  | { kind: "equip"; uid: string }
  | { kind: "unequip"; slot: GearSlot }
  | { kind: "enhance"; uid: string; isProtected: boolean }
  | { kind: "dismantle"; uid: string }
  | { kind: "forge"; weapon: WeaponKind; grade: number }
  // A paint or an engine trail worn; the guided first flight moved on, or skipped.
  | { kind: "wear"; cosmetic: "paint" | "trail"; id: string }
  | { kind: "guide"; step: number }
  | { kind: "skipGuide" }
  | { kind: "reset" };

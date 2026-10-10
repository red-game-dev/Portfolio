import { HullTier, Purse, Deed } from "../economy/domain/economy";
import type { LandingPhase } from "../landing";
import { ModuleId, WreckKind } from "./components";
import { FlareClass, ImpactOutcome } from "./events";
import { FaultKind } from "./faults";
import { ItemStack } from "./loot";

// Something the UI may want to say, as it happens, beyond what the snapshot shows.
export type VoyageNotice =
  | { kind: "tookOff" | "emergency"; body: string }
  | { kind: "recovered"; body: string; days: number }
  // Down in one piece at a speed (m/s), a phase of the way down beginning, or a touchdown too hard for the craft.
  | { kind: "landed"; body: string; speed: number | null }
  | { kind: "descent"; body: string; phase: LandingPhase }
  | { kind: "hardLanding"; body: string; speed: number; safe: number }
  | { kind: "captured"; isSingularity: boolean }
  | { kind: "destroyed" }
  | { kind: "flare"; flareClass: FlareClass; isHeading: boolean }
  | { kind: "storm" }
  | { kind: "failing"; module: ModuleId; isGone: boolean }
  | { kind: "melting"; temperatureC: number }
  | { kind: "impactAlert"; target: string; diameterKm: number; seconds: number }
  | { kind: "impact"; target: string; outcome: ImpactOutcome; craterKm: number }
  | { kind: "impactorBroken" | "deflected"; target: string }
  | { kind: "boss"; name: string; isFallen: boolean }
  | { kind: "heard" | "wormhole" }
  | { kind: "supernova"; seconds: number; isBlown: boolean }
  | { kind: "burst"; seconds: number; isFired: boolean }
  | { kind: "salvaged"; wreck: WreckKind; kept: ItemStack[]; lost: ItemStack[]; blueprints: string[] }
  | { kind: "fault" | "fixed"; fault: FaultKind }
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
  | { kind: "repair"; fault: number }
  | { kind: "trade"; direction: "sell" | "buy" }
  | { kind: "reset" };

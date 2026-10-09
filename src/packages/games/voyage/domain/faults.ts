import { ModuleId } from "./components";

// What breaks down on a ship that is pushed hard: an engine that misfires, a fuel line that leaks, a coolant
// loop that leaks so the hull runs hot, sensors that glitch so the guns aim wide, a shield emitter that will not
// recharge, and a breach that bleeds the hull.
export type FaultKind = "misfire" | "fuelLeak" | "coolantLeak" | "glitch" | "emitter" | "breach";

export const FAULT_KINDS: readonly FaultKind[] = ["misfire", "fuelLeak", "coolantLeak", "glitch", "emitter", "breach"];

// The system each fault is in.
export const FAULT_MODULE: Record<FaultKind, ModuleId> = {
  misfire: "engines",
  fuelLeak: "fuel",
  coolantLeak: "radiators",
  glitch: "sensors",
  emitter: "shields",
  breach: "hull",
};

// A fault on board: which, when it began (ms on the run's clock), and how bad, from 0.4 to 1.
export interface Fault {
  id: number;
  kind: FaultKind;
  at: number;
  severity: number;
}

// Something done to the ship from outside the run: a consumable used, a part fitted, a fault fixed. The economy
// decides what the pilot can afford; the simulation only applies it.
export type ShipEffect =
  | { kind: "hull"; share: number }
  | { kind: "module"; module: ModuleId | "worst"; amount: number }
  | { kind: "fuel"; share: number }
  | { kind: "shields"; share: number }
  | { kind: "cool"; degrees: number }
  | { kind: "fix"; fault: number };

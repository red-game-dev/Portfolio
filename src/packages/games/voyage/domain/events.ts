import { PickupKind } from "./components";

export type DamageKind = "impact" | "crash" | "heat" | "crush";

export type VoyagePhase = "solar" | "singularity" | "lost" | "universe";

// What the game tells its renderer and its UI, as it happens.
export interface VoyageEvents {
  hit: { x: number; y: number; angle: number; amount: number; toShields: number; toHull: number; kind: DamageKind };
  destroyed: { x: number; y: number; vx: number; vy: number; angle: number };
  collected: { kind: PickupKind; x: number; y: number };
  landed: { body: string };
  tookOff: { body: string };
  passing: { stop: string };
  phase: { phase: VoyagePhase; universe: number };
  // A black hole has the ship: the fall begins.
  captured: { x: number; y: number; isSingularity: boolean };
  emergency: { body: string };
}

import { ModuleId, PickupKind } from "./components";

export type DamageKind = "impact" | "crash" | "heat" | "melt" | "crush" | "radiation";

export type VoyagePhase = "solar" | "singularity" | "lost" | "universe";

// How strong a solar flare is, on the scale astronomers use.
export type FlareClass = "C" | "M" | "X";

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
  // The star flares: where on its limb (screen angle), how strong, and whether the storm it throws heads for the
  // ship.
  flare: { angle: number; strength: number; class: FlareClass; isHeading: boolean };
  // The storm from a flare reaches the ship.
  storm: { strength: number };
  // A system has fallen below half, or has gone.
  failing: { module: ModuleId; isGone: boolean };
  // The hull has passed the temperature it was built for.
  melting: { temperatureC: number };
}

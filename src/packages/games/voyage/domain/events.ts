import { AlienRole, ModuleId, PickupKind, Weapon, WreckKind } from "./components";
import { FaultKind } from "./faults";
import { Loot } from "./loot";

export type DamageKind = "impact" | "crash" | "heat" | "melt" | "crush" | "radiation" | "weapon" | "tidal" | "breach";

// What became of a world an impact struck: a crater, a burst high in its air, a scar that melted half a
// hemisphere, or the world broken apart.
export type ImpactOutcome = "crater" | "airburst" | "catastrophe" | "shattered";

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
  fired: { x: number; y: number; angle: number; kind: Weapon["kind"]; team: "ship" | "aliens" };
  // Someone who lives here was struck, or destroyed; the boss shows itself, or falls.
  struck: { x: number; y: number; toShields: number };
  downed: { x: number; y: number; role: AlienRole; faction: number; level: number };
  boss: { name: string; isFallen: boolean };
  // A drifting rock shot to pieces.
  shattered: { x: number; y: number; radius: number };
  // A rock is on its way to a world: which, how big (km), how long until it hits (seconds).
  impactAlert: { target: string; diameterKm: number; seconds: number };
  // It hit: where, how hard against what holds the world together, and what came of it.
  impact: { target: string; x: number; y: number; ratio: number; craterKm: number; outcome: ImpactOutcome };
  // It was broken up, or pushed off course so it will miss.
  impactorBroken: { x: number; y: number; target: string; isFragment: boolean };
  deflected: { target: string; isFragment: boolean };
  // The strange things: a dark forest hears the ship and strikes, a star collapses and blows, a gamma ray burst
  // lines up and fires, a wormhole throws the ship across the universe, tides stretch it.
  heard: { seconds: number };
  supernova: { seconds: number; isBlown: boolean };
  burst: { seconds: number; isFired: boolean };
  wormhole: { x: number; y: number };
  // A wreck stripped of what it held (perhaps nothing), something on board breaking down, and a fault fixed.
  salvaged: { x: number; y: number; kind: WreckKind; loot: Loot };
  fault: { kind: FaultKind; module: ModuleId };
  fixed: { kind: FaultKind };
}

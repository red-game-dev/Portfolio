import { TAU } from "@/packages/math/angles";
import { pick, RandomSource } from "@/packages/math/random";

import { BossMoveKind } from "../domain/components";

// The great attacks a boss has at each phase: a nova from the start, a charge once it has called its pack (below two
// thirds), a volley of missiles at the end (below a third).
export const BOSS_MOVES: ReadonlyArray<readonly BossMoveKind[]> = [["nova"], ["nova", "charge"], ["nova", "charge", "volley"]];

// How long each is shown before it lands (ms): long enough to see and get clear of.
export const TELEGRAPH_MS: Readonly<Record<BossMoveKind, number>> = { nova: 1300, charge: 1100, volley: 1000 };

// A nova's shots (more each phase), a charge's speed (world units a second) and how long it lasts (ms), a
// volley's missiles (more each phase), how much harder a charge hits than a ram, and when the first attack comes after
// the boss joins the fight (ms).
export const NOVA_SHOTS = 12;
export const NOVA_PER_PHASE = 4;
export const CHARGE_SPEED = 3.4;
export const CHARGE_MS = 900;
export const VOLLEY_MISSILES = 3;
export const CHARGE_HIT = 2.5;
export const FIRST_MOVE_MS = 3000;

const phaseOf = (phase: number): number => Math.max(0, Math.min(BOSS_MOVES.length - 1, phase));

// Which great attack a boss at a phase winds up next.
export const bossMoveFor = (phase: number, random: RandomSource): BossMoveKind => pick(random, BOSS_MOVES[phaseOf(phase)]);

// The seconds before the next one: shorter as the boss weakens.
export const moveGap = (phase: number, random: RandomSource): number => [7, 5.5, 4][phaseOf(phase)] + random() * 2;

// The directions of a nova's shots, evenly round, turned a little by `offset` so no two novas leave the same gaps.
export const novaDirections = (count: number, offset: number): Array<{ x: number; y: number }> => Array.from({ length: count }, (_, index) => {
  const angle = offset + (index / count) * TAU;

  return { x: Math.cos(angle), y: Math.sin(angle) };
});

// How far through its wind-up an attack is, 0 to 1.
export const windup = (kind: BossMoveKind, at: number, now: number): number => Math.max(0, Math.min(1, 1 - (at - now) / TELEGRAPH_MS[kind]));

import { HapticName, HapticPattern } from "../domain/types";

// Each moment's buzz, in ms of buzzing and pausing in turn: the lighter the moment, the shorter and fewer.
export const HAPTIC_PATTERNS: Readonly<Record<HapticName, HapticPattern>> = {
  tap: 8,
  hit: 28,
  bigHit: [60, 30, 40],
  pickup: [12, 40, 12],
  levelUp: [30, 60, 30, 60, 90],
  warning: [100, 80, 100],
  explosion: [90, 30, 160, 40, 70],
};

// Long enough apart that rapid hits are felt as hits, short enough that a single one is never lost.
export const DEFAULT_HAPTIC_GAP_MS = 60;

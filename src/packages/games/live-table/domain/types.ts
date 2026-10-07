// A live table round runs through these phases, then starts again.
export type LiveTablePhase = "place" | "final" | "closed" | "reveal";

export interface LiveTablePhaseTiming {
  phase: LiveTablePhase;
  ms: number;
}

// A card another player throws face down onto their betting spot. Times are simulation milliseconds.
export interface LiveTableThrow {
  id: number;
  seat: number;
  thrownAt: number;
}

export interface LiveTableOpponent {
  seat: number;
  cardsLeft: number;
}

// What the page shows: changes a handful of times a round, never once per frame.
export interface LiveTableSnapshot {
  phase: LiveTablePhase;
  round: number;
  hand: string[];
  // Your cards on the table, in the order they were thrown.
  played: string[];
  opponents: LiveTableOpponent[];
  canPlay: boolean;
}

// What the canvas draws every frame.
export interface LiveTableScene {
  now: number;
  phase: LiveTablePhase;
  phaseProgress: number;
  opponents: LiveTableOpponent[];
  throws: LiveTableThrow[];
  // Cards you have on the table, for the chips on your spot.
  playedCount: number;
}

export type LiveTableRefusal = "closed" | "not-in-hand";

export type LiveTablePlayResult = { accepted: true } | { accepted: false; reason: LiveTableRefusal };

export type LiveTableEvent =
  | { type: "phase"; phase: LiveTablePhase; round: number }
  | { type: "throw"; seat: number }
  | { type: "sweep" };

export interface LiveTableSize {
  width: number;
  height: number;
}

export interface LiveTableRenderer {
  resize(size: LiveTableSize, pixelRatio: number): void;
  draw(scene: LiveTableScene, now: number): void;
}

// What a mission asks: land on a world, reach a place, fly close to the Sun, skim a giant, salvage, bring down
// hostiles, save worlds, beat bosses, reach a universe, make things, upgrade the ship, live through something
// terrible, go through a wormhole, or score so much in one run.
export type MissionGoal =
  | { kind: "land"; body: string }
  | { kind: "reach"; place: string }
  | { kind: "sun"; au: number }
  | { kind: "skim"; count: number }
  | { kind: "salvage"; count: number }
  | { kind: "bounty"; count: number }
  | { kind: "rescue"; count: number }
  | { kind: "boss"; count: number }
  | { kind: "universe"; count: number }
  | { kind: "craft"; count: number }
  | { kind: "upgrade"; level: number }
  | { kind: "survive"; hazard: Peril }
  | { kind: "wormhole" }
  | { kind: "score"; points: number };

export type Peril = "supernova" | "burst" | "storm";

// A mission: what it asks, what it pays (experience and Red Coin), and the rank it is offered from.
export interface MissionSpec {
  id: string;
  goal: MissionGoal;
  xp: number;
  coin: number;
  minRank: number;
}

// A mission on the board, and how far along it is.
export interface MissionProgress {
  id: string;
  progress: number;
}

// Something that happened that a mission may count.
export type CareerEvent =
  | { kind: "landed"; body: string }
  | { kind: "passed"; place: string }
  | { kind: "sun"; au: number }
  | { kind: "skimmed"; body: string }
  | { kind: "salvaged" }
  | { kind: "bounty" }
  | { kind: "rescue" }
  | { kind: "boss" }
  | { kind: "universe"; count: number }
  | { kind: "crafted" }
  | { kind: "upgraded"; level: number }
  | { kind: "survived"; hazard: Peril }
  | { kind: "wormhole" }
  | { kind: "score"; points: number };

// A rank and the experience it takes.
export interface RankSpec {
  id: string;
  xp: number;
}

// The kinds of things the codex keeps: worlds of our own system, kinds of world, kinds of universe, galaxies,
// stars, the strange things, those who live out there, wrecks, and things found.
export type CodexCategory = "worlds" | "kinds" | "universes" | "galaxies" | "stars" | "phenomena" | "life" | "wrecks" | "things";

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  // What the entry is about, by the id the content names it with.
  subject: string;
  // Real figures, for the worlds of our own system.
  facts: CodexFacts | null;
}

export interface CodexFacts {
  radiusKm: number;
  gravity: number;
  dayHours: number | null;
  pressureBar: number | null;
  dayC: number;
  nightC: number;
}

// The daily voyage: the day (UTC, "2026-10-09"), the best score that day and how many runs.
export interface DailyRecord {
  day: string;
  best: number;
  runs: number;
}

// Everything a pilot's career keeps between runs.
export interface CareerProfile {
  xp: number;
  active: MissionProgress[];
  done: string[];
  // Repeatable contracts completed, which set how big the next one is.
  contracts: number;
  codex: string[];
  daily: DailyRecord | null;
}

// A mission done: which, and what it paid.
export interface MissionDone {
  mission: MissionSpec;
  xp: number;
  coin: number;
}

// What the UI shows of a career.
export interface CareerView {
  xp: number;
  rank: number;
  rankId: string;
  nextRank: { id: string; xp: number } | null;
  rankFloor: number;
  missions: Array<{ mission: MissionSpec; progress: number; target: number }>;
  done: number;
  codex: Array<{ entry: CodexEntry; isFound: boolean }>;
  found: number;
  daily: DailyRecord | null;
}

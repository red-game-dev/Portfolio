// What a mission asks: land on a world (or on any world past the singularity), reach a place, fly close to the Sun,
// skim a giant, salvage, bring down hostiles, save worlds, beat bosses, reach a universe, make things, upgrade the
// ship, live through something terrible (or anything terrible), go through a wormhole, or score so much in one run.
export type MissionGoal =
  | { kind: "land"; body: string }
  | { kind: "landAway" }
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
  | { kind: "survive"; hazard: Peril | "any" }
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

// Something that happened that a mission may count: a landing says whether it was past the singularity.
export type CareerEvent =
  | { kind: "landed"; body: string; isAway?: boolean }
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
export type CodexCategory = "worlds" | "kinds" | "universes" | "galaxies" | "stars" | "phenomena" | "life" | "wrecks" | "things" | "boosts";

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

// A step of the story: what it asks and what it pays, as a mission does.
export interface StoryStep {
  id: string;
  goal: MissionGoal;
  xp: number;
  coin: number;
}

// A chapter of the story: in a universe, its first step (reaching it) opens it and the rest count in any order once
// it is done; the launch's steps count in any order from the start.
export interface StoryChapter {
  id: string;
  steps: readonly StoryStep[];
}

// Where a pilot is in the story: the chapter (the number of chapters once it is all told) and how far along each
// of its steps is.
export interface StoryProgress {
  chapter: number;
  progress: number[];
}

// Everything a pilot's career keeps between runs. A career kept before the story began has none, and starts it.
export interface CareerProfile {
  xp: number;
  active: MissionProgress[];
  done: string[];
  // Repeatable contracts completed, which set how big the next one is.
  contracts: number;
  codex: string[];
  daily: DailyRecord | null;
  story?: StoryProgress;
}

// A mission done: which, and what it paid.
export interface MissionDone {
  mission: MissionSpec;
  xp: number;
  coin: number;
}

// A step of the story done, the chapter it belongs to, and what it paid.
export interface StoryStepDone {
  step: StoryStep;
  chapter: StoryChapter;
  xp: number;
  coin: number;
}

// The chapter under way (null once the story is all told), its place among them, and each step: how far along,
// what it takes, and whether it counts yet (in a universe's chapter, the rest wait for reaching it).
export interface StoryView {
  chapter: StoryChapter | null;
  index: number;
  total: number;
  steps: Array<{ step: StoryStep; progress: number; target: number; isOpen: boolean }>;
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
  // The missions finished, in the order they were, and the contracts done (counted, not kept).
  doneMissions: MissionSpec[];
  contracts: number;
  // The next missions in order not yet on the board, and whether each waits for a higher rank.
  upcoming: Array<{ mission: MissionSpec; isLocked: boolean }>;
  codex: Array<{ entry: CodexEntry; isFound: boolean }>;
  found: number;
  daily: DailyRecord | null;
  story: StoryView;
}

export interface DuelRound {
  agent: string;
  human: string;
  result: string;
}

export interface Duels {
  agentLabel: string;
  humanLabel: string;
  resultLabel: string;
  verdict: string;
  scoreLabel: string;
  scoreOf: string;
  roundLabel: string;
  versusLabel: string;
  koLabel: string;
  rounds: DuelRound[];
}

export interface BossLabels {
  boss: string;
  hp: string;
  defeated: string;
  loot: string;
}

export interface ArenaContent {
  boardLabel: string;
  hint: string;
  ready: string;
  start: string;
  again: string;
  resume: string;
  paused: string;
  over: string;
  newBest: string;
  score: string;
  lives: string;
  wave: string;
  best: string;
  // Written on the strip the bugs must not reach.
  production: string;
}

export interface FinaleRank {
  // Objectives completed to reach this rank.
  min: number;
  name: string;
}

export interface FinaleContent {
  kicker: string;
  title: string;
  screen: string[];
  screenLabel: string;
  summaryTitle: string;
  stats: {
    zones: string;
    bosses: string;
    duels: string;
    character: string;
    raid: string;
    time: string;
  };
  none: string;
  notPlayed: string;
  rankLabel: string;
  // "{done}" and "{total}" are replaced.
  objectives: string;
  ranks: FinaleRank[];
  finalQuest: string;
  contactNote: string;
  emailLabel: string;
  emailSubject: string;
  // "{rank}", "{bosses}" and "{duels}" are replaced, so my inbox sees how far the run went.
  emailBody: string;
  linkedInLabel: string;
  cvLabel: string;
  restartLabel: string;
}

export interface HudLabels {
  // Shown, and linked to the roster, until the reader has picked a character.
  pick: string;
  level: string;
  xp: string;
  bosses: string;
}

// The vertical progress label: which zone and section the reader is in.
export interface JourneyTrailContent {
  // "{index}", "{total}" and "{zone}" are replaced.
  zoneLabel: string;
  zones: Record<"matrix" | "ai" | "chain" | "casino" | "mmo", string>;
  // Titles for the parts of the page without a section intro.
  titles: {
    started: string;
    about: string;
  };
}

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

export interface HudLabels {
  // Shown, and linked to the roster, until the reader has picked a character.
  pick: string;
  level: string;
  xp: string;
  bosses: string;
}

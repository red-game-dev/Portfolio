import type { ZoneId } from "@/config/zones";

export interface DuelRound {
  agent: string;
  human: string;
  result: string;
  // Who was right. Defaults to me; the rounds the agent won stay on the page, with the rule I kept.
  winner?: "human" | "agent";
  rule?: string;
}

export interface DuelRule {
  name: string;
  detail: string;
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
  ruleLabel: string;
  rulesTitle: string;
  rulesDescription: string;
  rules: DuelRule[];
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

// The launch out of the game world, and what each moment of it is called.
export interface FinaleLaunch {
  boardLabel: string;
  hold: string;
  charging: string;
  liftOff: string;
  orbit: string;
  // Read out as each zone falls behind; "{zone}" is replaced.
  leaving: string;
  hint: string;
  // In orbit: carry on into space, or press the button nobody should press.
  continue: string;
  doNotPress: string;
  orbitHint: string;
  // "{seconds}" is replaced.
  countdown: string;
  boom: string;
}

// The voyage past orbit: out of the solar system, through a black hole, and from universe to universe.
export interface FinaleVoyage {
  title: string;
  intro: string;
  controls: string;
  canvasLabel: string;
  start: string;
  again: string;
  close: string;
  pause: string;
  resume: string;
  paused: string;
  score: string;
  best: string;
  shields: string;
  hull: string;
  fuel: string;
  // The live readings in the corner, and the units each is shown in ("{value}" is replaced).
  telemetry: {
    title: string;
    gravity: string;
    altitude: string;
    speed: string;
    sun: string;
    air: string;
    temperature: string;
    dilation: string;
    next: string;
  };
  units: {
    gravity: string;
    altitude: string;
    speed: string;
    au: string;
    pressure: string;
    temperature: string;
    dilation: string;
    km: string;
    millionKm: string;
  };
  // "{body}" is replaced.
  landed: string;
  tookOff: string;
  emergency: string;
  captured: string;
  // "{au}" is replaced with the distance from the Sun.
  distance: string;
  // "{count}" and "{name}" are replaced.
  universe: string;
  // What each stop on the way out is called, by its id in the game.
  stops: Record<string, string>;
  // "{stop}" is replaced.
  passing: string;
  singularity: string;
  lost: string;
  // "{universe}" is replaced: the first universe, then each one after.
  arrived: string;
  jumped: string;
  over: string;
  // "{score}" is replaced.
  finalScore: string;
  newBest: string;
}

export interface FinaleContent {
  kicker: string;
  title: string;
  launch: FinaleLaunch;
  voyage: FinaleVoyage;
  missionTitle: string;
  mission: string;
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
  // "{time}" is replaced with when I can be reached, from the profile, so it is said in one place.
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
  zones: Record<ZoneId, string>;
  // Titles for the parts of the page without a section intro.
  titles: {
    started: string;
    about: string;
  };
}

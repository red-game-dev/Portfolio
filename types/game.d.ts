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
  // Wheel, pinch and keys zoom; the map shows the whole system.
  map: string;
  closeMap: string;
  // Where the planet maps come from.
  credits: string;
  // The live readings in the corner, and the units each is shown in ("{value}" is replaced). Readings go dark
  // when the sensors fail.
  telemetry: {
    title: string;
    clock: string;
    gravity: string;
    altitude: string;
    speed: string;
    sun: string;
    air: string;
    temperature: string;
    outside: string;
    sunlight: string;
    radiation: string;
    dilation: string;
    next: string;
    noSignal: string;
  };
  units: {
    gravity: string;
    altitude: string;
    speed: string;
    au: string;
    pressure: string;
    temperature: string;
    sunlight: string;
    radiation: string;
    dilation: string;
    km: string;
    millionKm: string;
    // "{date}" is replaced with the mission clock's date and time.
    clock: string;
  };
  // The ship's systems, by id, and the panel they are listed in.
  systems: {
    title: string;
    names: Record<string, string>;
  };
  // "{body}" is replaced.
  landed: string;
  tookOff: string;
  emergency: string;
  captured: string;
  // "{class}" is replaced with the flare's class; the second when its storm heads for the ship.
  flare: string;
  flareHeading: string;
  storm: string;
  // "{system}" is replaced.
  failing: string;
  gone: string;
  // "{temperature}" is replaced.
  melting: string;
  // Universes past the site's zones are named from these syllables, and a faction by its manner.
  universeNames: {
    starts: string[];
    middles: string[];
    places: string[];
    factions: Record<"hostile" | "territorial" | "neutral" | "peaceful", string[]>;
  };
  // The guns and the MMO frames for what they are on.
  combat: {
    autoFire: string;
    holdFire: string;
    // "{level}" is replaced.
    level: string;
    boss: string;
    rock: string;
    dispositions: Record<"hostile" | "territorial" | "neutral" | "peaceful", string>;
    roles: { whale: string; trader: string };
    // "{diameter}", "{target}" and "{seconds}" are replaced.
    incoming: string;
    willMiss: string;
  };
  // "{diameter}", "{target}" and "{seconds}" are replaced.
  impactAlert: string;
  // What an impact did, "{target}" and "{crater}" replaced.
  impact: Record<"crater" | "airburst" | "catastrophe" | "shattered", string>;
  // "{target}" is replaced.
  impactorBroken: string;
  deflected: string;
  // "{name}" is replaced.
  bossAppears: string;
  bossFalls: string;
  heard: string;
  // "{seconds}" is replaced.
  supernovaWarning: string;
  supernova: string;
  burstWarning: string;
  burst: string;
  wormhole: string;
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

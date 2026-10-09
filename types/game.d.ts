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
type HullTierKey = "rocket" | "shuttle" | "corvette" | "starship" | "intergalactic";
type FaultKey = "misfire" | "fuelLeak" | "coolantLeak" | "glitch" | "emitter" | "breach";
type CurrencyKey = "RED" | "VOID";

// The hangar: the ship's hull and mark, the hold, the money as a ledger, the plans found, the faults on board and
// what is salvaged. Templates replace "{name}" placeholders.
export interface VoyageEconomyCopy {
  hangar: string;
  openHangar: string;
  closeHangar: string;
  // Where progress is kept: in the browser only.
  privacy: string;
  tabs: { ship: string; hold: string; plans: string; ledger: string };
  // "{tier}" and "{mark}" are replaced; marks are I to V.
  shipName: string;
  marks: string[];
  tiers: Record<HullTierKey, string>;
  tierNotes: Record<HullTierKey, string>;
  currencies: Record<CurrencyKey, string>;
  symbols: Record<CurrencyKey, string>;
  stats: { hull: string; shields: string; fuel: string; thrust: string; cargo: string; plating: string; pressure: string; guns: string; weapon: string };
  weapons: { cannon: string; laser: string };
  // "{value}" is replaced.
  units: { celsius: string; bar: string; times: string };
  // "{ship}" is replaced.
  next: string;
  top: string;
  needs: string;
  // "{have}" and "{need}" are replaced.
  have: string;
  blueprint: string;
  // A hull's plans as found, "{ship}" replaced.
  hullPlan: string;
  upgrade: string;
  // "{used}" and "{capacity}" are replaced.
  hold: string;
  emptyHold: string;
  use: string;
  // "{value}" is replaced.
  recycle: string;
  rarities: Record<"common" | "uncommon" | "rare" | "epic" | "legendary", string>;
  items: Record<string, { name: string; note: string }>;
  plans: { make: string; locked: string; hullPlans: string };
  // A ledger entry's wording by its kind, "{detail}" replaced; and what the balance row says.
  ledger: { balance: string; empty: string; memos: Record<string, string> };
  // "{price}" is replaced.
  trade: { sell: string; buy: string };
  faults: { title: string; names: Record<FaultKey, string>; notices: Record<FaultKey, string>; fix: string; noParts: string; fixed: string };
  salvage: {
    wrecks: Record<"probe" | "rocket" | "starship" | "alien" | "ore" | "ice", string>;
    progress: string;
    found: string;
    nothing: string;
    holdFull: string;
    blueprint: string;
  };
  // "{action}" is replaced with what the one click does.
  suggestion: { title: string; hint: string; upgrade: string; repair: string; craftFault: string; craftUpgrade: string; use: Record<"hull" | "fuel" | "shields" | "heat", string> };
  // "{red}" and "{void}" are replaced.
  earned: Record<"boss" | "universe" | "rescue", string>;
  upgraded: string;
  records: { title: string; runs: string; best: string; universes: string; bosses: string; rescues: string; salvaged: string };
  reset: { button: string; confirm: string; yes: string; no: string };
}

interface NamedNote {
  name: string;
  note: string;
}

// The career: missions and ranks, the codex of everything found, the daily voyage, its ghost and photo mode.
// Templates replace "{name}" placeholders.
export interface VoyageCareerCopy {
  tabs: { pilot: string; codex: string };
  ranks: Record<string, string>;
  // "{rank}" and "{ship}" are replaced.
  shipLine: string;
  // "{xp}" is replaced; then "{xp}" and "{rank}" for what the next rank takes.
  xp: string;
  nextRank: string;
  topRank: string;
  missionsTitle: string;
  missions: Record<string, string>;
  // "{count}" is replaced.
  contracts: Record<"salvage" | "bounty" | "rescue", string>;
  // "{progress}" and "{target}", then "{xp}" and "{coin}", then "{count}".
  progress: string;
  reward: string;
  done: string;
  // Notices: "{mission}", "{xp}" and "{coin}"; "{rank}"; "{name}".
  missionDone: string;
  promoted: string;
  discovered: string;
  codexTitle: string;
  // "{found}" and "{total}" are replaced.
  codexFound: string;
  categories: Record<"worlds" | "kinds" | "universes" | "stars" | "phenomena" | "life" | "wrecks" | "things", string>;
  unknown: string;
  kinds: Record<string, NamedNote>;
  universes: Record<string, NamedNote>;
  stars: Record<string, NamedNote>;
  phenomena: Record<string, NamedNote>;
  life: Record<string, NamedNote>;
  wreckNotes: Record<string, string>;
  // Real figures for our own worlds, "{value}" (or "{day}" and "{night}") replaced.
  facts: { radius: string; gravity: string; day: string; locked: string; pressure: string; temperature: string; surface: string };
  daily: { start: string; title: string; note: string; best: string; result: string; newBest: string };
  ghost: string;
  // "{date}" is replaced in the file's name.
  photo: { open: string; close: string; save: string; hint: string; file: string };
}

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
  // "{coin}" is replaced with the Red Coin a run's points paid.
  pay: string;
  economy: VoyageEconomyCopy;
  career: VoyageCareerCopy;
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

import type { ZoneId } from "@/config/zones";
import type { LaunchLand, LaunchMilestone, LaunchVehicle } from "@/packages/games/launch";
import type { BoostId, LandingMethod, LandingPhase, SlotRefusal, SurfaceBiome } from "@/packages/games/voyage";

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
// Whether the reader wants to play: the first time, the journey goes on by itself after a count unless they say
// no thanks. "{seconds}" is replaced.
export interface FinaleInvite {
  question: string;
  starting: string;
  play: string;
  playIn: string;
  decline: string;
}

// A real launch pad: its short name as the board writes it, where it is, its time zone (for the local time), what
// flies from it, the land round it, which way its rockets fly (1 to the right of the view), and whether the sea
// lies behind it.
export interface FinaleLaunchSite {
  name: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  vehicle: LaunchVehicle;
  land: LaunchLand;
  downrange: number;
  hasSea: boolean;
}

export interface FinaleLaunch {
  boardLabel: string;
  // The pads a launch may fly from, one picked at random each visit; on the pad, the board names it and its local
  // time ("{site}", "{time}").
  sites: FinaleLaunchSite[];
  pad: string;
  // What each moment of the flight is called, and the readout's labels.
  milestones: Record<LaunchMilestone, string>;
  readout: { altitude: string; speed: string };
  hold: string;
  charging: string;
  liftOff: string;
  orbit: string;
  // Read out at each moment of the flight as each zone falls behind; "{milestone}" and "{zone}" are replaced.
  leaving: string;
  hint: string;
  // In orbit: carry on into space, or press the button nobody should press.
  invite: FinaleInvite;
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
  // "{parts}" is replaced with every way a fault can be fixed, joined by `or`.
  faults: {
    title: string;
    names: Record<FaultKey, string>;
    notices: Record<FaultKey, string>;
    fix: string;
    makeAndFix: string;
    noParts: string;
    needs: string;
    // What joins the things one way needs, and the ways themselves.
    and: string;
    or: string;
    ground: string;
    fixed: string;
  };
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
  earned: Record<"boss" | "universe" | "rescue" | "hosted", string>;
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
  rewardXp: string;
  done: string;
  // Notices: "{mission}", "{xp}" and "{coin}"; "{rank}"; "{name}".
  missionDone: string;
  // The same for a mission that pays no coin.
  missionDoneXp: string;
  promoted: string;
  discovered: string;
  codexTitle: string;
  // "{found}" and "{total}" are replaced.
  codexFound: string;
  categories: Record<"worlds" | "kinds" | "universes" | "galaxies" | "stars" | "phenomena" | "life" | "wrecks" | "things" | "boosts", string>;
  // "{count}" is replaced with how many in a category are still to find.
  unknown: string;
  kinds: Record<string, NamedNote>;
  universes: Record<string, NamedNote>;
  galaxies: Record<string, NamedNote>;
  stars: Record<string, NamedNote>;
  phenomena: Record<string, NamedNote>;
  life: Record<string, NamedNote>;
  wreckNotes: Record<string, string>;
  // Real figures for our own worlds, "{value}" (or "{day}" and "{night}") replaced.
  facts: { radius: string; gravity: string; day: string; locked: string; pressure: string; temperature: string; surface: string };
  daily: { start: string; title: string; note: string; best: string; result: string; newBest: string };
  ghost: string;
  // What the map says where the black hole waits.
  edgeNote: string;
  // "{date}" is replaced in the file's name.
  photo: { title: string; open: string; close: string; save: string; hint: string; file: string };
}

// The boosts: each one's name and what it does; the ability bar's words ("{n}" a slot's number, "{name}" what it
// holds, "{count}", "{level}", "{seconds}"), and why a press did nothing; what a find says; and the hangar's Loadout.
export interface VoyageBoostCopy {
  names: Record<BoostId, string>;
  notes: Record<BoostId, string>;
  bar: { label: string; slot: string; empty: string; left: string; level: string; on: string; cooling: string; refused: Record<SlotRefusal, string> };
  found: string;
  firstFound: string;
  levelUp: string;
  loadout: {
    tab: string;
    note: string;
    slots: string;
    boosts: string;
    things: string;
    none: string;
    put: string;
    putLabel: string;
    clear: string;
    progress: string;
    top: string;
    charges: string;
  };
}

// The view from a world's surface: which world ("{body}"), the local time ("{time}"), what each kind of ground is
// called, and how to leave.
export interface FinaleSurface {
  title: string;
  time: string;
  biomes: Record<SurfaceBiome, string>;
  takeOff: string;
  // Home: a new rocket stands ready (at the finale's pad, "{pad}"), and how to launch it.
  ready: string;
  readyAt: string;
  launch: string;
  // Who lives here ("{faction}"), and how they meet the ship: welcomed, or fired on.
  people: string;
  welcome: string;
  hostile: string;
  // Home, the crew picked up at sea or on land while a new rocket is readied (at "{pad}"); then the pad ("{pad}"),
  // "{days}" days later.
  recoverySea: string;
  recoveryLand: string;
  readying: string;
  readyingAt: string;
  atPad: string;
  daysLater: string;
}

// The way down on a world, as the card reads it: what it is coming down on ("{body}"), the way each kind of world is
// landed on (home has a crew capsule's own), each phase, the readings ("{value}"), how fast it plays ("{pace}"),
// and what the pilot can do: nothing to fly, the guidance flying (and how to take over), or their hand on the burn
// ("{safe}" m/s to touch down under, "{seconds}" of burn left). Then the touchdown, gentle or too hard.
export interface FinaleDescent {
  title: string;
  methods: Record<LandingMethod, string>;
  home: string;
  phases: Record<LandingPhase, string>;
  altitude: string;
  speed: string;
  fall: string;
  load: string;
  pace: string;
  realTime: string;
  flown: string;
  takeOver: string;
  unflown: string;
  pilot: string;
  reserve: string;
  // Fired on from the ground on the way down, and how to get away.
  underFire: string;
  landedAt: string;
  hard: string;
}

export interface FinaleVoyage {
  title: string;
  surface: FinaleSurface;
  descent: FinaleDescent;
  intro: string;
  controls: string;
  // The same for a touch screen, where there are no keys.
  controlsTouch: string;
  // The first time the voyage opens, before the first flight: how the pilot likes to fly.
  setup: { title: string; note: string };
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
    // How much further out the black hole waits, until it wakes.
    blackHole: string;
    // The kind of space the ship is in, by id, and how hard tides stretch it.
    space: string;
    media: Record<"void" | "open" | "haze" | "belt" | "nebula" | "ring", string>;
    tides: string;
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
    // Metres and metres a second, for a landing's last stretch.
    metres: string;
    metresPerSecond: string;
    // "{value}" is replaced with AU still to go.
    further: string;
    // "{value}" is replaced with how many times what the hull takes the tides pull.
    tides: string;
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
  // The map's marks ("{mass}" is a black hole's in Suns) and its key.
  mapMarks: { mission: string; holeMass: string; keyMission: string; keyPull: string; keyHostile: string; keyRock: string; keyHazard: string };
  // Home safely, met and given a new rocket.
  recovered: string;
  // No fuel to leave ("{body}", "{seconds}", "{days}"): a rescue on its way in our solar system or the run ending in
  // the universes, each on a world or adrift; the run over; rescued; and the countdown while it runs.
  stranded: {
    rescueBegun: string;
    rescueBegunAdrift: string;
    lostBegun: string;
    lostBegunAdrift: string;
    over: string;
    rescued: string;
    rescuedAdrift: string;
    rescueIn: string;
    lostIn: string;
  };
  // After a run ends: what is kept for the next one.
  kept: string;
  emergency: string;
  captured: string;
  // "{class}" is replaced with the flare's class; the second when its storm heads for the ship.
  flare: string;
  flareHeading: string;
  storm: string;
  // A storm turned aside by the magnetic shield boost.
  stormTurned: string;
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
    // A system's belt of rocks, named for its star: "{star}" is replaced.
    belt: string;
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
  // "{universe}", "{galaxy}" and "{star}" are filled from the phrases below.
  arrived: string;
  jumped: string;
  galaxyPhrases: Record<string, string>;
  starPhrases: Record<string, string>;
  starPair: string;
  starTrio: string;
  // A maze universe: where the ship is in it ("{count}", "{name}", "{system}", "{explored}", "{systems}"), and what
  // is said through a gate ("{system}"): a new system, one with the way on, a dead end, one been to before.
  universeMaze: string;
  // Down on a world someone lives on ("{faction}", "{body}"): welcomed, or fired on.
  hosted: string;
  groundFire: string;
  // A gate's name over it ("{name}") once its system has been reached: the one with the way on, or any other.
  gate: { through: string; wayOn: string; deadEnd: string; again: string; markWayOn: string; markVisited: string };
  over: string;
  // "{score}" is replaced.
  finalScore: string;
  newBest: string;
  // "{coin}" is replaced with the Red Coin a run's points paid.
  pay: string;
  economy: VoyageEconomyCopy;
  career: VoyageCareerCopy;
  boosts: VoyageBoostCopy;
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
  // For a reader who is not hiring: pass my name on, share the site, or recommend me if we have worked together.
  referral: { note: string; share: string; recommend: string };
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

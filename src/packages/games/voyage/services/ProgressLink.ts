import { VoyageSimulation } from "../core/VoyageSimulation";
import { VoyageNotice } from "../domain/notices";
import { VoyageSnapshot } from "../domain/snapshot";
import { TIERS, tierOf } from "../economy/config/tiers";
import { Deed } from "../economy/domain/economy";
import { Hangar } from "../economy/services/Hangar";
import { GEAR_EXP, PILOT_EXP } from "../gear/config/levels";
import { AmmoStock, GearDrop } from "../gear/domain/gear";
import { Armory } from "../gear/services/Armory";
import { baseOf, rackFor } from "../gear/utils/gear";
import { ProgressOutcome } from "../progress/domain/progress";
import { Progress } from "../progress/services/Progress";

// Inside this distance of the Sun (AU) a pass counts as brushing it.
const SUN_BRUSH_AU = 0.1;
// What a daily voyage's score must reach for its second and third stars.
const DAILY_STARS = [3000, 8000];

// What a run came to, for the card at its end: how long, the score, the places reached and worlds landed on, the
// kills and best streak, the Red Coin and experience earned and any levels gained, the universes reached and stars
// won, the gear found and the achievements unlocked.
export interface RunSummary {
  seconds: number;
  score: number;
  places: number;
  landings: number;
  kills: number;
  bestStreak: number;
  coin: number;
  exp: number;
  levels: number;
  level: number;
  universes: number;
  stars: number;
  gear: GearDrop[];
  achievements: string[];
  isDaily: boolean;
}

// What a run has come to so far, and where its Red Coin, experience and level started.
interface RunCounts {
  places: number;
  landings: number;
  kills: number;
  stars: number;
  gear: GearDrop[];
  achievements: string[];
  coinAt: number;
  expAt: number;
  levelAt: number;
}

const newRun = (coinAt = 0, expAt = 0, levelAt = 1): RunCounts => ({ places: 0, landings: 0, kills: 0, stars: 0, gear: [], achievements: [], coinAt, expAt, levelAt });

export interface ProgressLinkOptions {
  simulation: VoyageSimulation;
  hangar: Hangar;
  armory: Armory;
  progress: Progress;
  notify: (notice: VoyageNotice) => void;
  refresh: () => void;
  // Refits the ship for what it is now (its fittings or the pilot's level changed).
  refit: () => void;
}

// Joins a run to the pilot's armoury and progress: every deed earns the pilot experience and every fitted piece a
// share of it; a weapon earns its own from each hit and kill, the armour and shields from what they take; shots
// spend the racks' ammunition; finds bring gear and ammunition; each universe reached wins its stars; lifetime
// counts move and achievements unlock as they do; and a run that ends is summed up for its card. The weapons on the
// bar are armed for the run whenever the bar or the fittings change, and the ship refitted when the pilot levels.
export class ProgressLink {
  public summary: RunSummary | null = null;
  private readonly simulation: VoyageSimulation;
  private readonly hangar: Hangar;
  private readonly armory: Armory;
  private readonly progress: Progress;
  private readonly notify: (notice: VoyageNotice) => void;
  private readonly refresh: () => void;
  private readonly refit: () => void;
  private run: RunCounts = newRun();
  private isSettled = false;
  private hasBrushedSun = false;
  private level = 1;

  constructor({ simulation, hangar, armory, progress, notify, refresh, refit }: ProgressLinkOptions) {
    this.simulation = simulation;
    this.hangar = hangar;
    this.armory = armory;
    this.progress = progress;
    this.notify = notify;
    this.refresh = refresh;
    this.refit = refit;
    this.level = progress.level;
  }

  // A new run: the racks aboard, the bar's weapons armed, and nothing counted yet.
  public startRun(): void {
    this.simulation.setAmmo(this.armory.stock);
    this.arm();
    this.run = newRun(this.hangar.purse.RED, this.progress.exp, this.progress.level);
    this.isSettled = false;
    this.hasBrushedSun = false;
    this.summary = null;
    this.settle(this.progress.record("runs"));
    this.settle(this.progress.record("shipLevel", this.hangar.level));
  }

  // The weapons on the bar, armed as the armoury makes them for the run to fire.
  public arm(): void {
    const weapons = this.hangar.view().bar
      .map((row) => (row.slot?.kind === "weapon" ? this.armory.armed(row.slot.id) : null))
      .filter((weapon): weapon is NonNullable<typeof weapon> => weapon !== null);

    this.simulation.setArsenal(weapons);
  }

  public attach(): () => void {
    const { simulation, armory, hangar, progress } = this;
    const { events } = simulation;
    const offs = [
      events.on("fired", ({ team, ammo }) => {
        if (team === "ship" && ammo) {
          armory.spendAmmo(ammo);
        }
      }),
      events.on("struck", ({ source }) => {
        const uid = source ?? armory.fitted("primary")?.uid;

        if (uid) {
          armory.gainExp(uid, GEAR_EXP.hit);
        }
      }),
      events.on("downed", ({ source, role, level }) => {
        const uid = source ?? armory.fitted("primary")?.uid;
        const piece = uid ? armory.piece(uid) : null;

        if (uid) {
          armory.gainExp(uid, GEAR_EXP.kill);
        }

        if (role !== "trader" && role !== "whale") {
          this.run.kills += 1;
          this.settle(progress.record("kills"));

          if (piece && baseOf(piece.base)?.weapon === "mine") {
            this.settle(progress.record("mineKills"));
          }
        }

        if (role === "fighter") {
          this.gain(PILOT_EXP.bountyPerLevel * Math.max(1, level));
        }
      }),
      events.on("hit", ({ amount }) => {
        ["armor", "shield"].forEach((slot) => {
          const uid = slot === "armor" ? armory.fitted("armor")?.uid : armory.fitted("shield")?.uid;

          if (uid) {
            armory.gainExp(uid, (amount / 100) * GEAR_EXP.perHundredTaken);
          }
        });
      }),
      events.on("salvaged", ({ loot }) => {
        this.take(loot.gear ?? [], loot.ammo ?? {});
        this.settle(progress.record("salvaged"));
      }),
      events.on("opened", ({ kind, loot }) => {
        // A cache's or a chest's things go in the hold, as a wreck's do, through the hangar.
        const { kept, lost, blueprints } = hangar.stow(loot);

        this.notify({ kind: "opened", chest: kind === "chest", kept, lost, blueprints });
        this.take(loot.gear ?? [], loot.ammo ?? {});

        if (kind === "chest") {
          this.settle(progress.record("chests"));
        }
      }),
      events.on("streak", ({ count }) => {
        this.settle(progress.record("bestStreak", count));
        hangar.reward({ kind: "streak", count });
        this.notify({ kind: "streak", count });
      }),
      events.on("boosted", () => this.settle(progress.record("boostsUsed"))),
      events.on("storm", ({ isTurned }) => {
        if (isTurned) {
          this.settle(progress.record("stormsTurned"));
        }
      }),
      events.on("flare", ({ class: flareClass }) => {
        if (flareClass === "X") {
          this.settle(progress.record("xFlares"));
        }
      }),
      events.on("passing", () => {
        this.run.places += 1;
      }),
      events.on("landed", ({ body }) => {
        this.run.landings += 1;
        this.settle(progress.record("landings"));
        this.settle(progress.seen("landed", body, "landedWorlds"));
      }),
      events.on("gate", () => this.settle(progress.record("gates"))),
      events.on("wormhole", () => this.settle(progress.record("wormholes"))),
      events.on("heard", () => this.settle(progress.record("heard"))),
      events.on("hosted", () => this.settle(progress.record("hosted"))),
      events.on("deflected", () => this.settle(progress.record("deflections"))),
      events.on("phase", ({ phase, universe }) => {
        if (phase === "universe") {
          this.settle(progress.record("universes", simulation.state.universes));
          this.starsFor(universe, false);
        }
      }),
      // Taken by a black hole out of a universe: its stars as it was left.
      events.on("captured", () => {
        if (simulation.state.phase === "universe") {
          this.starsFor(simulation.state.universe, true);
        }
      }),
      // The bar or the fittings changed: the weapons are armed again and the ship refitted.
      armory.subscribe(() => {
        this.refit();
        this.arm();
        this.refresh();
      }),
      hangar.subscribe(() => this.arm()),
      progress.subscribe(() => {
        // A new level makes the ship a little stronger.
        if (progress.level !== this.level) {
          this.level = progress.level;
          this.refit();
        }

        this.refresh();
      }),
    ];

    return () => offs.forEach((off) => off());
  }

  // Experience for a deed paid.
  public deed(deed: Deed): void {
    switch (deed.kind) {
      case "discovery":
        this.gain(PILOT_EXP.discovery);
        break;
      case "landing":
        this.gain(PILOT_EXP.landing);
        break;
      case "hosted":
        this.gain(PILOT_EXP.hosted);
        break;
      case "rescue":
        this.gain(PILOT_EXP.rescue);
        this.settle(this.progress.record("rescues"));
        break;
      case "boss":
        this.gain(PILOT_EXP.boss + PILOT_EXP.bossPerUniverse * Math.max(0, this.simulation.state.universe));
        this.settle(this.progress.record("bosses"));
        break;
      case "universe":
        this.gain(PILOT_EXP.universe + PILOT_EXP.universePerIndex * deed.index);
        break;
      case "coin":
        this.gain(PILOT_EXP.coin * deed.count);
        this.settle(this.progress.record("coins", deed.count));
        break;
      default:
        break;
    }
  }

  public mission(xp: number): void {
    this.gain(xp);
  }

  // What the pilot did from the hangar that lifetime counts read.
  public crafted(): void {
    this.settle(this.progress.record("crafted"));
  }

  public upgraded(level: number): void {
    this.settle(this.progress.record("shipLevel", level));
  }

  public enhanced(step: number): void {
    this.settle(this.progress.record("enhanceBest", step));
  }

  // On every snapshot: the Sun brushed past, and a run that ended summed up once.
  public tick(snapshot: VoyageSnapshot): void {
    const { state } = this.simulation;

    if (!this.hasBrushedSun && snapshot.status === "flying" && state.closestAu < SUN_BRUSH_AU) {
      this.hasBrushedSun = true;
      this.settle(this.progress.record("sunBrush"));
    }

    if (snapshot.status !== "over" || this.isSettled) {
      return;
    }

    this.isSettled = true;

    if (state.phase === "universe") {
      this.starsFor(state.universe, true);
    }

    if (state.daily) {
      const stars = 1 + DAILY_STARS.filter((score) => snapshot.score >= score).length;

      this.addStars(`d:${state.daily}`, stars);
      this.settle(this.progress.record("dailyRuns"));
    }

    this.gain(Math.floor(snapshot.score / PILOT_EXP.pointsPerExp));

    const { run, progress } = this;

    this.summary = {
      seconds: Math.round(state.elapsedMs / 1000),
      score: snapshot.score,
      places: run.places,
      landings: run.landings,
      kills: run.kills,
      bestStreak: state.streak.best,
      coin: Math.max(0, this.hangar.purse.RED - run.coinAt),
      exp: Math.max(0, progress.exp - run.expAt),
      levels: progress.level - run.levelAt,
      level: progress.level,
      universes: state.universes,
      stars: run.stars,
      gear: [...run.gear],
      achievements: [...run.achievements],
      isDaily: state.daily !== null,
    };
    this.refresh();
  }

  // Experience for the pilot, and every fitted piece a share of it.
  private gain(amount: number): void {
    if (amount <= 0) {
      return;
    }

    this.armory.gainFittedExp(amount * GEAR_EXP.shareOfPilot);

    const outcome = this.progress.gainExp(amount);

    if (outcome.levels > 0) {
      this.notify({ kind: "levelUp", level: outcome.level });
    }

    this.settle(outcome);
  }

  // Gear and ammunition found: every piece the pilot's, the ammunition into the racks as far as they hold, both
  // aboard for the run at once.
  private take(gear: readonly GearDrop[], ammo: Partial<AmmoStock>): void {
    const hull = TIERS.indexOf(tierOf(this.hangar.level));
    const added = this.armory.addAmmo(ammo, (type) => rackFor(type, hull));
    const kept = gear.filter((drop) => this.armory.add(drop) !== null);

    this.simulation.addAmmo(added);
    this.run.gear.push(...kept);

    if (kept.length > 0 || Object.keys(added).length > 0) {
      this.notify({ kind: "loot", gear: kept, ammo: added });
    }
  }

  // A universe's stars: one for reaching it, one for leaving with half the hull or more, one for bringing down its
  // boss.
  private starsFor(universe: number, isLeaving: boolean): void {
    const { state, world } = this.simulation;
    const health = world.stores.health.get(state.ship);
    const isSound = isLeaving && health !== undefined && health.hull >= health.maxHull * 0.5 && state.status === "flying";

    this.addStars(`u:${universe}`, 1 + (isSound ? 1 : 0) + (isLeaving && state.bossFallen ? 1 : 0));
  }

  private addStars(key: string, stars: number): void {
    const { gained, outcome } = this.progress.recordStars(key, stars);

    if (gained > 0) {
      this.run.stars += gained;
      this.gain(PILOT_EXP.star * gained);
      this.notify({ kind: "stars", key, stars, gained });
    }

    this.settle(outcome);
  }

  // What progress moving unlocked, announced.
  private settle({ achievements, cosmetics }: ProgressOutcome): void {
    achievements.forEach((id) => {
      this.run.achievements.push(id);
      this.notify({ kind: "achievement", id });
    });
    cosmetics.forEach((id) => this.notify({ kind: "cosmetic", id }));
  }
}

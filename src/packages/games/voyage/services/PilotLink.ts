import { codexId } from "../career/config/codex";
import { RANKS } from "../career/config/ranks";
import { CareerEvent, Peril } from "../career/domain/career";
import { Career, CareerOutcome } from "../career/services/Career";
import { VoyageSimulation } from "../core/VoyageSimulation";
import { HOME_WORLD } from "../domain/content";
import { VoyageNotice } from "../domain/notices";
import { VoyageSnapshot } from "../domain/snapshot";
import { configForLevel } from "../economy/config/tiers";
import { Deed } from "../economy/domain/economy";
import { Hangar } from "../economy/services/Hangar";

// Deeds big enough to announce what they paid.
const ANNOUNCED: ReadonlyArray<Deed["kind"]> = ["boss", "universe", "rescue", "hosted"];
// Coins picked up are paid together at most this often (ms of the run), so a run's ledger keeps room for deeds.
const COIN_BATCH_MS = 1000;
// The Sun's closest approach is only worth telling a mission inside this distance (AU).
const SUN_WATCH_AU = 1;
// How near the ship someone must be to count as seen, for the codex (world units).
const SEEN_REACH = 4;

export interface PilotLinkOptions {
  simulation: VoyageSimulation;
  hangar: Hangar;
  career: Career | null;
  // A place's name where the universe made one up, else its id.
  nameOf: (id: string) => string;
  notify: (notice: VoyageNotice) => void;
  // The economy changed and should reach the UI.
  refresh: () => void;
}

// Joins a run to the pilot who flies it: deeds pay into the hangar and count for the career's missions, finds go
// in the hold (what does not fit back on the wreck), whatever is seen goes in the codex, a level changed from
// outside a run refits the ship, and a run that ends is paid for its points and, as a daily voyage, recorded. It
// keeps what one run needs to say each thing once: the worlds landed on, the rocks stopped, a danger lived
// through.
export class PilotLink {
  private readonly simulation: VoyageSimulation;
  private readonly hangar: Hangar;
  private readonly career: Career | null;
  private readonly nameOf: (id: string) => string;
  private readonly notify: (notice: VoyageNotice) => void;
  private readonly refresh: () => void;
  private readonly baseConfig;
  private landed = new Set<string>();
  private savedRocks = new Set<number>();
  private peril: Peril | null = null;
  private isRunSettled = false;
  private pendingCoins = 0;
  private coinsPaidAt = 0;

  constructor({ simulation, hangar, career, nameOf, notify, refresh }: PilotLinkOptions) {
    this.simulation = simulation;
    this.hangar = hangar;
    this.career = career;
    this.nameOf = nameOf;
    this.notify = notify;
    this.refresh = refresh;
    this.baseConfig = simulation.config;
    simulation.refit(configForLevel(this.baseConfig, hangar.level), hangar.level);
  }

  // A new run: nothing landed on, stopped or lived through yet.
  public startRun(): void {
    this.landed = new Set();
    this.savedRocks = new Set();
    this.peril = null;
    this.isRunSettled = false;
    this.pendingCoins = 0;
    this.coinsPaidAt = 0;
    this.count({ kind: "upgraded", level: this.hangar.level });
    // Every run starts at Earth, which is passed already, so no passing tells the codex of it.
    this.discover(codexId("worlds", HOME_WORLD));
  }

  public attach(): () => void {
    const { simulation, hangar, career } = this;
    const { events } = simulation;
    const offs = [
      events.on("passing", ({ stop }) => {
        this.pay({ kind: "discovery", place: this.nameOf(stop) });
        this.count({ kind: "passed", place: stop });
        this.discoverPlace(stop);
      }),
      events.on("landed", ({ body }) => {
        if (!this.landed.has(body)) {
          this.landed.add(body);
          this.pay({ kind: "landing", place: this.nameOf(body) });
        }

        this.count({ kind: "landed", body });
        this.discoverPlace(body);
      }),
      events.on("skimmed", ({ body }) => this.count({ kind: "skimmed", body })),
      events.on("hosted", ({ body }) => this.pay({ kind: "hosted", place: this.nameOf(body) })),
      // Red Coins picked up in flight are gathered, and paid into the wallet together (see `tick`).
      events.on("collected", ({ kind }) => {
        if (kind === "coin") {
          this.pendingCoins += 1;
        }
      }),
      events.on("downed", ({ role, level }) => {
        if (role === "fighter") {
          this.pay({ kind: "bounty", level });
          this.count({ kind: "bounty" });
        }
      }),
      events.on("boss", ({ name, isFallen }) => {
        if (isFallen) {
          this.pay({ kind: "boss", name });
          this.count({ kind: "boss" });
        }
      }),
      // A world is saved once per rock: turning it and then breaking it, or breaking the pieces of one already
      // broken, pays nothing more.
      events.on("impactorBroken", ({ rock, target, isFragment }) => this.save(rock, target, isFragment, false)),
      events.on("deflected", ({ rock, target, isFragment }) => this.save(rock, target, isFragment, true)),
      events.on("phase", ({ phase, universe }) => {
        if (phase === "universe") {
          this.pay({ kind: "universe", index: universe });
          this.count({ kind: "universe", count: simulation.state.universes });
          this.discoverUniverse();
        }
      }),
      events.on("captured", () => this.discover(codexId("phenomena", "blackHole"))),
      events.on("wormhole", () => this.count({ kind: "wormhole" })),
      events.on("storm", () => {
        this.peril = "storm";
      }),
      events.on("weathered", ({ peril }) => {
        this.peril = peril;
      }),
      events.on("salvaged", ({ wreck, kind, loot }) => {
        const { kept, lost, blueprints } = hangar.stow(loot);

        // What does not fit stays on the wreck for when there is room; the wreck counts as salvaged only once
        // it is stripped, so a full hold cannot salvage one wreck over and over.
        simulation.returnLoot(wreck, { items: lost, blueprints: [] });
        this.notify({ kind: "salvaged", wreck: kind, kept, lost, blueprints });

        if (lost.length === 0) {
          this.count({ kind: "salvaged" });
        }

        this.discover(codexId("wrecks", kind));
        kept.forEach(({ id }) => this.discover(codexId("things", id), false));
      }),
      // A fault, or its fix, changes what can be mended from the hold.
      events.on("fault", () => this.refresh()),
      events.on("fixed", () => this.refresh()),
      hangar.subscribe(() => {
        // A level that changed from outside a run (a reset, another tab's save) refits the ship too.
        if (hangar.level !== simulation.state.level) {
          simulation.refit(configForLevel(this.baseConfig, hangar.level), hangar.level);
        }

        this.refresh();
      }),
    ];

    if (career) {
      offs.push(career.subscribe(() => this.refresh()));
    }

    return () => offs.forEach((off) => off());
  }

  // What the pilot did from the hangar that a mission may count.
  public crafted(): void {
    this.count({ kind: "crafted" });
  }

  public upgraded(level: number): void {
    this.count({ kind: "upgraded", level });
  }

  // On every snapshot: a danger lived through once the ship is still flying after it, the Sun's closest approach,
  // who is near enough to be seen, and a run that has ended settled once.
  public tick(snapshot: VoyageSnapshot): void {
    this.payCoins(snapshot.status === "over");

    if (snapshot.status === "flying") {
      if (this.peril) {
        this.count({ kind: "survived", hazard: this.peril });
        this.peril = null;
      }

      const au = this.simulation.state.closestAu;

      if (au < SUN_WATCH_AU && this.career?.isWatching("sun")) {
        this.count({ kind: "sun", au });
      }

      this.seeLife();
    }

    if (snapshot.status === "over" && !this.isRunSettled) {
      this.isRunSettled = true;
      this.peril = null;
      this.notify({ kind: "paid", coin: this.hangar.endRun(snapshot.score) });
      this.count({ kind: "score", points: snapshot.score });

      const day = this.simulation.state.daily;

      if (day && this.career) {
        this.notify({ kind: "daily", day, score: snapshot.score, isBest: this.career.recordDaily(day, snapshot.score) });
      }
    }
  }

  // The coins gathered since the last payment, as one entry: at most once a second, and whatever is left when the
  // run ends.
  private payCoins(isFinal: boolean): void {
    const now = this.simulation.state.elapsedMs;

    if (this.pendingCoins === 0 || (!isFinal && now - this.coinsPaidAt < COIN_BATCH_MS)) {
      return;
    }

    this.pay({ kind: "coin", count: this.pendingCoins });
    this.pendingCoins = 0;
    this.coinsPaidAt = now;
  }

  private pay(deed: Deed): void {
    const amounts = this.hangar.reward(deed);

    if (ANNOUNCED.includes(deed.kind)) {
      this.notify({ kind: "earned", deed: deed.kind, amounts });
    }
  }

  private save(rock: number, target: string, isFragment: boolean, isDeflected: boolean): void {
    if (isFragment || this.savedRocks.has(rock)) {
      return;
    }

    this.savedRocks.add(rock);
    this.pay({ kind: "rescue", target: this.nameOf(target), isDeflected });
    this.count({ kind: "rescue" });
  }

  // Counts something for the career's missions, and pays and announces what it finishes.
  private count(event: CareerEvent): void {
    if (!this.career) {
      return;
    }

    this.settle(this.career.record(event));
  }

  private settle({ done, promoted }: CareerOutcome): void {
    done.forEach(({ mission, xp, coin }) => {
      if (coin > 0) {
        this.hangar.reward({ kind: "mission", id: mission.id, coin });
      }

      this.notify({ kind: "missionDone", mission: mission.id, xp, coin });
    });

    if (promoted !== null) {
      this.notify({ kind: "promoted", rank: RANKS[promoted].id });
    }
  }

  // Marks something seen in the codex, announcing it when new (things found go in quietly: the find itself is
  // announced).
  private discover(id: string, isAnnounced = true): void {
    if (this.career?.discover(id) && isAnnounced) {
      this.notify({ kind: "discovered", entry: id });
    }
  }

  // A place passed: one of our own worlds, or a kind of world in a universe.
  private discoverPlace(stop: string): void {
    const { state } = this.simulation;
    const kind = state.cosmos?.classes[stop];

    this.discover(state.phase === "universe" && kind ? codexId("kinds", kind) : codexId("worlds", stop));
  }

  // A universe reached: its kind, the galaxy it sits in, its stars (and that they are a pair or a triple), and every
  // strange thing it holds.
  private discoverUniverse(): void {
    const cosmos = this.simulation.state.cosmos;

    if (!cosmos) {
      return;
    }

    this.discover(codexId("universes", cosmos.style));
    this.discover(codexId("galaxies", cosmos.galaxy.kind));
    this.discover(codexId("stars", cosmos.starKind ?? "none"));
    cosmos.companionKinds.forEach((kind) => this.discover(codexId("stars", kind)));

    if (cosmos.multiplicity !== "single") {
      this.discover(codexId("stars", cosmos.multiplicity === "triple" ? "triple" : "binary"));
    }
    cosmos.phenomena.forEach((phenomenon) => this.discover(codexId("phenomena", phenomenon.kind)));
  }

  // Whoever is near enough to the ship to be seen.
  private seeLife(): void {
    const { world, state } = this.simulation;
    const ship = world.stores.body.get(state.ship);

    if (!ship || !this.career || world.stores.alien.size === 0) {
      return;
    }

    world.stores.alien.entities.forEach((entity, index) => {
      const alien = world.stores.alien.values[index];
      const at = world.stores.body.get(entity);
      const shape = alien.role === "trader" || alien.role === "whale" ? alien.role : state.cosmos?.factions[alien.faction]?.shape;

      if (at && shape && Math.hypot(at.x - ship.x, at.y - ship.y) < SEEN_REACH) {
        this.discover(codexId("life", shape));
      }
    });
  }
}

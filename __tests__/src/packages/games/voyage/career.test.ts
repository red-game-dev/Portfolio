import { MemoryAdapter } from "@/packages/browser/store";
import {
  Career,
  CODEX,
  codexId,
  contractFor,
  dailyEpoch,
  dailySeed,
  dayKey,
  DEFAULT_VOYAGE_CONFIG,
  ghostAt,
  GhostRecorder,
  Hangar,
  isGhostRun,
  isPilotProfile,
  MISSIONS,
  missionById,
  newCareer,
  newEconomyProfile,
  newProfile,
  PilotLink,
  PilotRepository,
  placeCode,
  rankFor,
  RANKS,
  resolveVoyageConfig,
  SolarSystemSource,
  StepRandom,
  SystemService,
  VoyageConfig,
  VoyageNotice,
  VoyageSimulation,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const defaults = DEFAULT_VOYAGE_CONFIG;
const EPOCH = Date.parse("2026-10-09T12:00:00Z");

const CALM: Partial<VoyageConfig> = {
  spawn: { ...defaults.spawn, open: 0, belt: 0, universe: 0, universeGrowth: 0, pickups: 0, cometEvery: [1e6, 1e6] },
  weather: { ...defaults.weather, every: [1e6, 1e6] },
  impacts: { ...defaults.impacts, every: [1e6, 1e6] },
  traffic: [1e6, 1e6],
  salvage: { ...defaults.salvage, every: [1e6, 1e6] },
  faults: { ...defaults.faults, rate: 0 },
};

const create = (seed = 3) => {
  const simulation = new VoyageSimulation(new SystemService(new SolarSystemSource(), defaults.layout).getView(), {
    config: resolveVoyageConfig(CALM),
    random: createSeededRandom(seed),
    epochMs: EPOCH,
  });

  simulation.setView(2, 1.4);

  return simulation;
};

describe("voyage career", () => {
  test("three missions on the board, in order, each paying once it is done, and promotions by experience", () => {
    const career = new Career();
    const first = career.view().missions.map(({ mission }) => mission.id);

    expect(first).toEqual(MISSIONS.slice(0, 3).map((mission) => mission.id));

    const outcome = career.record({ kind: "landed", body: "moon" });

    expect(outcome.done.map(({ mission }) => mission.id)).toEqual(["landMoon"]);
    expect(career.xp).toBe(MISSIONS[0].xp);
    expect(career.view().missions).toHaveLength(3);
    expect(career.view().missions.map(({ mission }) => mission.id)).not.toContain("landMoon");
    expect(career.record({ kind: "landed", body: "moon" }).done).toHaveLength(0);

    career.record({ kind: "salvaged" });

    const promoted = career.record({ kind: "passed", place: "mars" });

    expect(promoted.promoted).toBe(rankFor(career.xp));
    expect(RANKS[career.rank].id).toBe("ensign");
  });

  test("counted goals add up, levels and universes take the most reached, and the closest pass to the Sun counts", () => {
    const career = new Career({ ...newCareer(), active: [{ id: "bountyFive", progress: 0 }, { id: "upgradeThree", progress: 0 }, { id: "sunHalf", progress: 0 }] });

    [1, 2, 3, 4].forEach(() => career.record({ kind: "bounty" }));
    expect(career.view().missions.find(({ mission }) => mission.id === "bountyFive")?.progress).toBe(4);
    career.record({ kind: "upgraded", level: 2 });
    expect(career.record({ kind: "upgraded", level: 3 }).done.map(({ mission }) => mission.id)).toEqual(["upgradeThree"]);
    expect(career.record({ kind: "sun", au: 0.7 }).done).toHaveLength(0);
    expect(career.record({ kind: "sun", au: 0.45 }).done.map(({ mission }) => mission.id)).toEqual(["sunHalf"]);
  });

  test("once every mission is done, contracts keep coming, each bigger, read back from their ids alone", () => {
    const career = new Career({ ...newCareer(), xp: 99999, done: MISSIONS.map((mission) => mission.id) });
    const board = career.view().missions.map(({ mission }) => mission.id);

    expect(board).toEqual([contractFor(0).id, contractFor(1).id, contractFor(2).id]);
    expect(missionById(contractFor(3).id)?.goal).toEqual({ kind: "salvage", count: 6 });
    expect(missionById("contract:nonsense:3")).toBeNull();
  });

  test("the codex holds every world of our own system with its real figures, and marks each thing seen once", () => {
    const career = new Career();
    const earth = CODEX.find((entry) => entry.id === codexId("worlds", "earth"));

    expect(earth?.facts?.radiusKm).toBeCloseTo(6371, -1);
    expect(earth?.facts?.gravity).toBeCloseTo(9.8, 0);
    expect(career.discover(codexId("phenomena", "pulsar"))).toBe(true);
    expect(career.discover(codexId("phenomena", "pulsar"))).toBe(false);
    expect(career.discover("phenomena:unicorn")).toBe(false);
    expect(career.view().found).toBe(1);
  });

  test("the daily voyage is the same for everyone each UTC day, and keeps that day's best", () => {
    const career = new Career();
    const day = dayKey(Date.parse("2026-10-09T23:30:00Z"));

    expect(day).toBe("2026-10-09");
    expect(dayKey(Date.parse("2026-10-10T00:10:00Z"))).toBe("2026-10-10");
    expect(dailySeed(day)).toBe(dailySeed("2026-10-09"));
    expect(dailySeed(day)).not.toBe(dailySeed("2026-10-10"));
    expect(dailyEpoch(day)).toBe(Date.parse("2026-10-09T12:00:00Z"));
    expect(career.recordDaily(day, 1200)).toBe(true);
    expect(career.recordDaily(day, 900)).toBe(false);
    expect(career.dailyBest(day)).toBe(1200);
    expect(career.dailyBest("2026-10-10")).toBe(0);
  });

  test("two daily runs from the same day meet the same universes; a free run does not", () => {
    const first = create(1);
    const second = create(2);

    first.start(dailyEpoch("2026-10-09"), { day: "2026-10-09", seed: dailySeed("2026-10-09") });
    second.start(dailyEpoch("2026-10-09"), { day: "2026-10-09", seed: dailySeed("2026-10-09") });
    expect(first.state.runSeed).toBe(second.state.runSeed);
    expect(first.state.daily).toBe("2026-10-09");

    second.start(EPOCH);
    expect(second.state.daily).toBeNull();
  });

  test("a ghost replays where the ship was, only where the ship is too, and is kept checked", () => {
    const recorder = new GhostRecorder();
    const solar = placeCode("solar", -1);

    recorder.sample(0, 0, 0, 0, solar);
    recorder.sample(200, 10, 0, 0, solar);
    recorder.sample(400, 20, 0, 0, placeCode("universe", 0));

    const run = recorder.finish("2026-10-09", 900);

    expect(ghostAt(run, 100, solar)).toMatchObject({ x: 5, y: 0 });
    expect(ghostAt(run, 300, solar)).toBeNull();
    expect(ghostAt(run, 900, solar)).toBeNull();
    expect(isGhostRun(run)).toBe(true);
    expect(isGhostRun({ ...run, samples: [1, 2, 3] })).toBe(false);
  });

  test("a profile kept before careers is brought up to date, its hangar kept", async () => {
    const adapter = new MemoryAdapter();
    const older = { ...newEconomyProfile(), level: 4 };

    await adapter.set("pilot", { version: 1, data: older });

    const repository = new PilotRepository(adapter);
    const profile = await repository.load();

    expect(isPilotProfile(profile)).toBe(true);
    expect(profile.level).toBe(4);
    expect(profile.career).toEqual(newCareer());
    expect(await repository.loadGhost()).toBeNull();
  });

  test("the pilot link pays deeds, counts missions and fills the codex from what happens in a run", () => {
    const simulation = create();
    const hangar = new Hangar(newProfile());
    const career = new Career();
    const notices: VoyageNotice[] = [];
    const link = new PilotLink({ simulation, hangar, career, nameOf: (id) => id, notify: (notice) => notices.push(notice), refresh: () => undefined });

    link.attach();
    simulation.start(EPOCH);
    link.startRun();
    simulation.events.emit("landed", { body: "moon" });
    simulation.events.emit("passing", { stop: "mars" });

    expect(notices.some((notice) => notice.kind === "missionDone" && notice.mission === "landMoon")).toBe(true);
    expect(career.hasFound(codexId("worlds", "mars"))).toBe(true);
    expect(hangar.purse.RED).toBeGreaterThanOrEqual(25 + 15 + MISSIONS[0].coin);
    expect(hangar.view().history.some((row) => row.memo === "mission:landMoon")).toBe(true);
  });

  test("a daily run's draws start over at every step, so what one pilot does differently does not change the rest", () => {
    const first = new StepRandom(dailySeed("2026-10-09"));
    const second = new StepRandom(dailySeed("2026-10-09"));

    first.reseed(240);
    second.reseed(240);
    // One pilot's ship was hit this step, which drew from it twice more.
    first.next();
    first.next();
    first.reseed(241);
    second.reseed(241);
    expect([first.next(), first.next()]).toEqual([second.next(), second.next()]);
  });

  test("a wreck salvaged with a full hold is not counted until it is stripped, and a mission paying no coin writes no entry", () => {
    const simulation = create();
    const hangar = new Hangar({ ...newProfile(), cargo: [{ id: "titanium", count: 7 }] });
    const career = new Career({ ...newCareer(), active: [{ id: "salvageOne", progress: 0 }, { id: "upgradeThree", progress: 0 }] });
    const link = new PilotLink({ simulation, hangar, career, nameOf: (id) => id, notify: () => undefined, refresh: () => undefined });

    link.attach();
    simulation.start(EPOCH);
    link.startRun();
    simulation.events.emit("salvaged", { wreck: 0, x: 0, y: 0, kind: "rocket", loot: { items: [{ id: "titanium", count: 2 }], blueprints: [] } });
    expect(career.view().missions.find(({ mission }) => mission.id === "salvageOne")?.progress).toBe(0);

    simulation.events.emit("salvaged", { wreck: 0, x: 0, y: 0, kind: "rocket", loot: { items: [], blueprints: [] } });
    expect(career.view().missions.some(({ mission }) => mission.id === "salvageOne")).toBe(false);

    const entries = hangar.view().history.length;

    link.upgraded(3);
    expect(hangar.view().history.length).toBe(entries);
  });

  test("contracts are counted, not kept by id, and the Sun's nearest pass is told only to a mission that wants it", () => {
    const career = new Career({ ...newCareer(), xp: 99999, done: MISSIONS.map((mission) => mission.id) });

    expect(career.isWatching("sun")).toBe(false);
    [1, 2, 3, 4].forEach(() => career.record({ kind: "salvaged" }));
    expect(career.toProfile().done).toHaveLength(MISSIONS.length);
    expect(career.toProfile().contracts).toBe(1);
    expect(career.view().done).toBe(MISSIONS.length + 1);
    expect(new Career().isWatching("land")).toBe(true);
  });

  test("the nearest the ship comes to the Sun is measured every step", () => {
    const simulation = create();

    simulation.start(EPOCH);
    simulation.step(100);
    expect(simulation.state.closestAu).toBeGreaterThan(0.9);
    expect(simulation.state.closestAu).toBeLessThan(1.1);
  });
});

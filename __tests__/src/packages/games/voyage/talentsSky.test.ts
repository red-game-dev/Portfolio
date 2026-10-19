import {
  alignmentsIn,
  Armory,
  Hangar,
  newProfile,
  ProgressLink,
  progressView,
  VoyageNotice,
  canLearn,
  cleanTalents,
  DEFAULT_VOYAGE_CONFIG,
  isProgressProfile,
  METEOR_SHOWERS,
  newProgressProfile,
  PILOT_LEVELS,
  Progress,
  showersOn,
  skyEventsOn,
  TALENTS,
  talentPoints,
  talentStats,
} from "@/packages/games/voyage";

import { createFlying, runOf } from "./fixtures/simulation";

const at = (iso: string) => Date.parse(iso);
const ids = (events: Array<{ id: string; isPeak: boolean }>) => events.map(({ id, isPeak }) => `${id}${isPeak ? "!" : ""}`);

describe("the pilot's talents", () => {
  test("a point every six levels, fewer than every rank, so a pilot chooses", () => {
    expect(talentPoints(1)).toBe(0);
    expect(talentPoints(6)).toBe(1);
    expect(talentPoints(300)).toBe(50);
    expect(TALENTS.reduce((sum, spec) => sum + spec.max, 0)).toBeGreaterThan(talentPoints(300));
  });

  test("a rank needs a free point, room below its most, and its branch open far enough", () => {
    const longBarrel = TALENTS.find(({ id }) => id === "longBarrel");
    const rapid = TALENTS.find(({ id }) => id === "rapidLoader");

    expect(longBarrel && rapid).toBeTruthy();

    if (!longBarrel || !rapid) {
      return;
    }

    expect(canLearn({}, rapid, 6)).toBe(true);
    expect(canLearn({}, rapid, 5)).toBe(false);
    expect(canLearn({ rapidLoader: 5 }, rapid, 300)).toBe(false);
    expect(canLearn({ rapidLoader: 4 }, longBarrel, 300)).toBe(false);
    expect(canLearn({ rapidLoader: 5 }, longBarrel, 300)).toBe(true);
  });

  test("what the talents add sums every rank, and a profile claiming too much is trimmed to what its level gives", () => {
    expect(talentStats({ heavyCalibre: 2, plating: 1 })).toEqual({ damage: 0.06, hull: 0.04 });
    expect(cleanTalents({ heavyCalibre: 9, deadEye: 1, nothing: 3 }, 30)).toEqual({ heavyCalibre: 5 });
  });

  test("a pilot learns ranks with the points their level gives, and takes them all back for nothing", () => {
    const progress = new Progress({ ...newProgressProfile(), exp: PILOT_LEVELS.startOf(12) });

    expect(progress.talentPointsLeft).toBe(2);
    expect(progress.learn("plating")).toBe(true);
    expect(progress.learn("plating")).toBe(true);
    expect(progress.learn("plating")).toBe(false);
    expect(progress.talents).toEqual({ plating: 2 });
    expect(progress.unlearnAll()).toBe(true);
    expect(progress.talentPointsLeft).toBe(2);
    expect(isProgressProfile(progress.toProfile())).toBe(true);
  });

  test("a profile from before talents still reads back whole", () => {
    const { talents, ...older } = newProgressProfile();

    expect(talents).toBeUndefined();
    expect(isProgressProfile(older)).toBe(true);
    expect(new Progress(older).talents).toEqual({});
  });
});

describe("the real sky", () => {
  test("each shower is on through its yearly window and at its peak about its peak night, across the new year too", () => {
    expect(ids(showersOn(at("2026-10-21T12:00:00Z")))).toEqual(["shower:orionids!"]);
    expect(ids(showersOn(at("2026-10-11T12:00:00Z")))).toEqual(["shower:orionids"]);
    expect(ids(showersOn(at("2026-08-12T22:00:00Z")))).toEqual(["shower:perseids!"]);
    expect(ids(showersOn(at("2027-01-02T12:00:00Z")))).toEqual(["shower:quadrantids!"]);
    expect(ids(showersOn(at("2026-12-29T12:00:00Z")))).toEqual(["shower:quadrantids"]);
    expect(showersOn(at("2026-07-01T12:00:00Z"))).toEqual([]);
    expect(new Set(METEOR_SHOWERS.map(({ id }) => id)).size).toBe(METEOR_SHOWERS.length);
  });

  test("planets close together, or an outer one opposite the Sun, are read from where they really are", () => {
    const simulation = createFlying();
    const { system } = runOf(simulation);
    const place = (id: string, x: number, y: number) => {
      const body = system.bodies.find((entry) => entry.id === id);

      if (body) {
        Object.assign(body.real, { x, y, z: 0 });
      }
    };

    place("earth", 1, 0);
    place("mercury", -0.4, 0);
    place("venus", -0.7, 0);
    place("mars", 1.5, 0.5);
    place("jupiter", 3.83, 2.82);
    place("saturn", 9.5, 0.01);

    expect(alignmentsIn(system).map(({ id }) => id)).toEqual(expect.arrayContaining(["conjunction:mars:jupiter", "opposition:saturn"]));
    expect(alignmentsIn(system).some(({ subjects }) => subjects.includes("mercury") || subjects.includes("venus"))).toBe(false);
    expect(skyEventsOn(system, at("2026-10-21T12:00:00Z")).map(({ kind }) => kind)).toContain("shower");
  });

  test("a shower thickens our solar system with stardust: twice the coins drift by", () => {
    const pickups = 4;
    const count = (isShower: boolean) => {
      const simulation = createFlying({ spawn: { ...DEFAULT_VOYAGE_CONFIG.spawn, open: 0, belt: 0, universe: 0, pickups } });

      simulation.setSky(isShower ? [{ id: "shower:orionids", kind: "shower", subjects: ["orionids"], isPeak: false }] : []);
      simulation.step(DEFAULT_VOYAGE_CONFIG.stepMs * 2);

      return simulation.world.stores.pickup.values.filter(({ kind }) => kind === "coin").length;
    };

    expect(count(true) - count(false)).toBeGreaterThanOrEqual(pickups - 1);
  });

  test("a run flown under a sky event earns its badge once a year, and says so", () => {
    const simulation = createFlying();
    const armory = new Armory();
    const progress = new Progress();
    const hangar = new Hangar(newProfile(), { weapons: armory.port() });
    const notices: VoyageNotice[] = [];
    const link = new ProgressLink({ simulation, hangar, armory, progress, notify: (notice) => notices.push(notice), refresh: () => undefined, refit: () => undefined });

    simulation.setSky([{ id: "shower:orionids", kind: "shower", subjects: ["orionids"], isPeak: true }]);
    link.startRun();
    link.startRun();

    expect(notices.filter(({ kind }) => kind === "sky")).toEqual([{ kind: "sky", event: "shower:orionids", isPeak: true }]);
    expect(progressView(progress).skySeen).toEqual([`shower:orionids:${new Date(simulation.state.clock.epochMs).getUTCFullYear()}`]);
  });
});

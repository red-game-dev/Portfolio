import {
  advanceStory,
  Career,
  cleanStory,
  DEFAULT_VOYAGE_CONFIG,
  Hangar,
  isCareerProfile,
  newCareer,
  newProfile,
  newStory,
  PilotLink,
  resolveVoyageConfig,
  SolarSystemSource,
  STORY,
  storyView,
  SystemService,
  targetOf,
  VoyageNotice,
  VoyageSimulation,
  VoyageState,
} from "@/packages/games/voyage";
import { createSeededRandom } from "@/packages/math/random";

const EPOCH = Date.parse("2026-10-09T12:00:00Z");
const told = { chapter: STORY.length, progress: [] };
const at = (id: string) => ({ chapter: STORY.findIndex((chapter) => chapter.id === id), progress: STORY.find((chapter) => chapter.id === id)?.steps.map(() => 0) ?? [] });

describe("games/voyage story", () => {
  test("it runs out of our solar system, then a chapter for each universe of the site's zones in order, then the sixth", () => {
    expect(STORY.map(({ id }) => id)).toEqual(["launch", "matrix", "ai", "chain", "casino", "mmo", "beyond"]);
    STORY.slice(1).forEach((chapter, index) => expect(chapter.steps[0].goal).toEqual({ kind: "universe", count: index + 1 }));

    const ids = STORY.flatMap(({ steps }) => steps.map(({ id }) => id));

    expect(new Set(ids).size).toBe(ids.length);
    STORY.flatMap(({ steps }) => steps).forEach((step) => {
      expect(step.xp).toBeGreaterThan(0);
      expect(step.coin).toBeGreaterThan(0);
    });
  });

  test("the launch's steps count in any order from the start", () => {
    let story = newStory();

    story = advanceStory(story, { kind: "passed", place: "pluto" }).story;
    story = advanceStory(story, { kind: "passed", place: "mars" }).story;
    expect(storyView(story).steps.map(({ progress, isOpen }) => [progress, isOpen])).toEqual([[0, true], [1, true], [1, true]]);

    const launched = advanceStory(story, { kind: "landed", body: "moon" });

    expect(launched.chapter?.id).toBe("launch");
    expect(launched.story).toEqual(at("matrix"));
  });

  test("a universe's chapter opens on reaching it; the rest wait for that, then count in any order", () => {
    let story = at("chain");

    story = advanceStory(story, { kind: "salvaged" }).story;
    expect(storyView(story).steps.map(({ progress, isOpen }) => [progress, isOpen])).toEqual([[0, true], [0, false], [0, false]]);

    const opened = advanceStory(story, { kind: "universe", count: 3 });

    expect(opened.done.map(({ step }) => step.id)).toEqual(["chainReach"]);
    expect(opened.chapter).toBeNull();
    // What opened the chapter is not counted for its other steps as well.
    expect(storyView(opened.story).steps.map(({ progress, isOpen }) => [progress, isOpen])).toEqual([[3, true], [0, true], [0, true]]);

    story = opened.story;
    [1, 2, 3, 4, 5].forEach(() => {
      story = advanceStory(story, { kind: "bounty" }).story;
    });
    story = advanceStory(story, { kind: "salvaged" }).story;
    story = advanceStory(story, { kind: "salvaged" }).story;

    const finished = advanceStory(story, { kind: "salvaged" });

    expect(finished.done.map(({ step }) => step.id)).toEqual(["chainSalvage"]);
    expect(finished.chapter?.id).toBe("chain");
    expect(finished.story).toEqual(at("casino"));
  });

  test("past the singularity a landing anywhere counts, at home it does not; any danger lived through counts in the Casino", () => {
    let story = advanceStory(at("matrix"), { kind: "universe", count: 1 }).story;

    expect(advanceStory(story, { kind: "landed", body: "moon", isAway: false }).done).toHaveLength(0);
    story = advanceStory(story, { kind: "landed", body: "veldara-b", isAway: true }).story;
    expect(storyView(story).steps.find(({ step }) => step.id === "matrixLand")?.progress).toBe(1);

    const casino = advanceStory(at("casino"), { kind: "universe", count: 4 }).story;

    (["supernova", "burst", "storm"] as const).forEach((hazard) => {
      expect(advanceStory(casino, { kind: "survived", hazard }).done.map(({ step }) => step.id)).toEqual(["casinoSurvive"]);
    });
  });

  test("the last chapter told leaves nothing under way, and nothing more counts", () => {
    const last = advanceStory(at("beyond"), { kind: "universe", count: 6 });

    expect(last.chapter?.id).toBe("beyond");
    expect(last.story).toEqual(told);
    expect(storyView(last.story)).toEqual({ chapter: null, index: STORY.length, total: STORY.length, steps: [] });
    expect(advanceStory(told, { kind: "universe", count: 9 }).done).toHaveLength(0);
  });

  test("a story read back is made to fit: none starts it, odd counts are floored and capped, a chapter past the end is the story told", () => {
    expect(cleanStory(undefined)).toEqual(newStory());
    expect(cleanStory({ chapter: 3, progress: [1.7, 99] })).toEqual({ chapter: 3, progress: [1, targetOf(STORY[3].steps[1].goal), 0] });
    expect(cleanStory({ chapter: 40, progress: [3] })).toEqual(told);
    expect(cleanStory({ chapter: -1, progress: [-2] })).toEqual(newStory());

    const { story, ...before } = newCareer();

    expect(story).toEqual(newStory());
    // A career kept before the story began reads back whole, and starts it.
    expect(isCareerProfile(before)).toBe(true);
    expect(new Career(before).view().story.chapter?.id).toBe("launch");
    // Odd numbers in a story are made to fit as it is read, never a reason to start the whole career again; only a
    // story of the wrong shape is.
    expect(isCareerProfile({ ...before, story: { chapter: -1, progress: [0.5] } })).toBe(true);
    expect(new Career({ ...before, story: { chapter: -1, progress: [0.5] } }).toProfile().story).toEqual(newStory());
    expect(isCareerProfile({ ...before, story: { chapter: "2", progress: [] } })).toBe(false);
  });

  test("the career pays each step, counts it on the board's watch, and keeps where it is", () => {
    const career = new Career({ ...newCareer(), story: at("casino") });

    expect(career.isWatching("universe")).toBe(true);
    expect(career.isWatching("boss")).toBe(false);

    const outcome = career.record({ kind: "universe", count: 4 });

    expect(outcome.story.map(({ step, xp, coin }) => [step.id, xp, coin])).toEqual([["casinoReach", STORY[4].steps[0].xp, STORY[4].steps[0].coin]]);
    expect(career.isWatching("boss")).toBe(true);
    expect(career.toProfile().story).toEqual({ chapter: 4, progress: [4, 0, 0] });
  });

  test("the pilot hears each step paid, the chapter told and the next opened, and a chapter that opens where the ship is opens at once", () => {
    const simulation = new VoyageSimulation(new SystemService(new SolarSystemSource(), DEFAULT_VOYAGE_CONFIG.layout).getView(), {
      config: resolveVoyageConfig({}),
      random: createSeededRandom(3),
      epochMs: EPOCH,
    });
    const hangar = new Hangar(newProfile());
    // The Matrix all but told: reached, a wreck salvaged, one landing to go.
    const career = new Career({ ...newCareer(), story: { chapter: 1, progress: [1, 1, 0] } });
    const notices: VoyageNotice[] = [];
    const link = new PilotLink({ simulation, hangar, career, nameOf: (id) => id, notify: (notice) => notices.push(notice), refresh: () => undefined });

    link.attach();
    simulation.start(EPOCH);
    link.startRun();
    expect(notices.filter(({ kind }) => kind === "storyOpened")).toEqual([{ kind: "storyOpened", chapter: "matrix" }]);
    notices.length = 0;

    // Already two universes deep when the Matrix is told, the AI chapter opens at once.
    const state = simulation.state as VoyageState;

    state.phase = "universe";
    state.universes = 2;
    simulation.events.emit("landed", { body: "veldara-b", speed: 1 });

    expect(notices.filter(({ kind }) => kind.startsWith("story"))).toEqual([
      { kind: "storyStep", step: "matrixLand", xp: STORY[1].steps[2].xp, coin: STORY[1].steps[2].coin },
      { kind: "storyChapter", chapter: "matrix" },
      { kind: "storyOpened", chapter: "ai" },
      { kind: "storyStep", step: "aiReach", xp: STORY[2].steps[0].xp, coin: STORY[2].steps[0].coin },
    ]);
    expect(hangar.view().history.some((row) => row.memo === "story:matrixLand")).toBe(true);
    expect(career.view().story.steps.map(({ progress }) => progress)).toEqual([2, 0]);
  });
});

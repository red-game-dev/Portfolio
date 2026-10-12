import { questsDone, STORY_QUEST, trackedQuest } from "@/components/Finale/Voyage/quests";
import { Career, MISSIONS, newCareer, STORY } from "@/packages/games/voyage";

describe("the voyage's quests", () => {
  test("the story's next open step is followed until a mission on the board is pinned", () => {
    const career = new Career();

    expect(trackedQuest(career.view(), null)).toEqual({ id: STORY_QUEST, kind: "story", objective: "launchMoon", chapter: "launch", progress: 0, target: 1 });
    expect(trackedQuest(career.view(), "reachMars")).toMatchObject({ id: "reachMars", kind: "mission", objective: "reachMars", chapter: null });
    // A pin for a mission no longer on the board falls back to the story.
    expect(trackedQuest(career.view(), "landVenus")?.id).toBe(STORY_QUEST);
  });

  test("a step done moves the story on to the next one still open; once it is all told, the first mission", () => {
    const career = new Career();

    career.record({ kind: "landed", body: "moon" });
    expect(trackedQuest(career.view(), STORY_QUEST)?.objective).toBe("launchMars");

    const told = new Career({ ...newCareer(), story: { chapter: STORY.length, progress: [] } });

    expect(trackedQuest(told.view(), STORY_QUEST)).toMatchObject({ kind: "mission", id: told.view().missions[0].mission.id });
  });

  test("every mission, contract and step of the story done counts, so a quest finished shows as news", () => {
    const career = new Career();
    const before = questsDone(career.view());

    // The Moon finishes a mission and the story's first step.
    career.record({ kind: "landed", body: "moon" });
    expect(questsDone(career.view())).toBe(before + 2);
    expect(questsDone(new Career({ ...newCareer(), story: { chapter: 2, progress: [0, 0] } }).view())).toBe(STORY[0].steps.length + STORY[1].steps.length);
  });

  test("what comes next is in the order the board takes it: the missions the rank allows, then the nearest rank's", () => {
    // A lieutenant's board early on, after the first eight missions and the third upgrade; the Storm mission is offered
    // at rank 1 although the list has it after missions for rank 2.
    const done = [...MISSIONS.slice(0, 8).map(({ id }) => id), "upgradeThree"];
    const career = new Career({ ...newCareer(), xp: 160, done, story: { chapter: STORY.length, progress: [] } });
    const view = career.view();
    const offered = view.missions.map(({ mission }) => mission.id);
    const next = view.upcoming.map(({ mission }) => mission.id);

    expect(view.rank).toBe(1);
    expect(next[0]).toBe("surviveStorm");
    expect(view.upcoming[0].isLocked).toBe(false);
    expect(next.some((id) => offered.includes(id))).toBe(false);

    // Finishing a mission on the board brings the first of what came next onto it.
    career.record({ kind: "passed", place: "pluto" });
    expect(career.view().missions.map(({ mission }) => mission.id)).toContain(next[0]);
  });

  test("the career lists the missions done, the contracts, and what comes next with the rank it waits for", () => {
    const career = new Career();

    career.record({ kind: "landed", body: "moon" });

    const view = career.view();

    expect(view.doneMissions.map(({ id }) => id)).toEqual(["landMoon"]);
    expect(view.contracts).toBe(0);
    expect(view.upcoming.length).toBeGreaterThan(0);
    view.upcoming.forEach(({ mission, isLocked }) => {
      expect(view.missions.some((entry) => entry.mission.id === mission.id)).toBe(false);
      expect(isLocked).toBe(mission.minRank > view.rank);
    });
  });
});

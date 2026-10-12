import type { CareerView } from "@/packages/games/voyage";
import { STORY } from "@/packages/games/voyage";

// The story, as a quest to follow; anything else followed is a mission, by its id.
export const STORY_QUEST = "story";

// The quest followed on the HUD: what it is, the objective to name (a step of the story or a mission), the chapter it
// belongs to, and how far along it is.
export interface TrackedQuest {
  id: string;
  kind: "story" | "mission";
  objective: string;
  chapter: string | null;
  progress: number;
  target: number;
}

// Whether something read back can name a quest to follow.
export const isQuestId = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 64;

// The quest followed: the one pinned while it is under way, else the story's next open step, else the first mission
// on the board; none once the story is told and the board is empty.
export const trackedQuest = (view: CareerView, pinned: string | null): TrackedQuest | null => {
  const step = view.story.steps.find(({ isOpen, progress, target }) => isOpen && progress < target);
  const story: TrackedQuest | null = view.story.chapter && step
    ? { id: STORY_QUEST, kind: "story", objective: step.step.id, chapter: view.story.chapter.id, progress: step.progress, target: step.target }
    : null;
  const missionQuest = (entry: CareerView["missions"][number]): TrackedQuest =>
    ({ id: entry.mission.id, kind: "mission", objective: entry.mission.id, chapter: null, progress: entry.progress, target: entry.target });
  const pinnedMission = view.missions.find(({ mission }) => mission.id === pinned);

  if (pinned === STORY_QUEST && story) {
    return story;
  }

  if (pinnedMission) {
    return missionQuest(pinnedMission);
  }

  return story ?? (view.missions[0] ? missionQuest(view.missions[0]) : null);
};

// How many quests are done: missions, contracts and steps of the story. It changes whenever one is finished, which is
// also when a new one arrives.
export const questsDone = (view: CareerView): number => {
  const told = STORY.slice(0, view.story.index).reduce((sum, chapter) => sum + chapter.steps.length, 0);
  const underWay = view.story.steps.filter(({ progress, target }) => progress >= target).length;

  return view.done + told + underWay;
};

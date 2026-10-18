import { MissionGoal, StoryChapter, StoryProgress, StoryStep } from "../domain/career";

const step = (id: string, goal: MissionGoal, xp: number, coin: number): StoryStep => ({ id, goal, xp, coin });

// The story, a chapter at a time: out of our solar system to the singularity, then one chapter for each universe of
// the site's zones in the order the voyage reaches them, and the seventh universe past them. A universe's chapter opens
// on reaching it, and its other steps count in any order after that; the launch's steps count in any order from the
// start. Steps pay as missions do, more the deeper the chapter.
export const STORY: readonly StoryChapter[] = [
  {
    id: "launch",
    steps: [
      step("launchMoon", { kind: "land", body: "moon" }, 80, 50),
      step("launchMars", { kind: "reach", place: "mars" }, 80, 50),
      step("launchPluto", { kind: "reach", place: "pluto" }, 150, 100),
    ],
  },
  {
    id: "matrix",
    steps: [
      step("matrixReach", { kind: "universe", count: 1 }, 200, 120),
      step("matrixSalvage", { kind: "salvage", count: 1 }, 120, 80),
      step("matrixLand", { kind: "landAway" }, 150, 100),
    ],
  },
  {
    id: "ai",
    steps: [
      step("aiReach", { kind: "universe", count: 2 }, 250, 150),
      step("aiSave", { kind: "rescue", count: 1 }, 200, 120),
    ],
  },
  {
    id: "chain",
    steps: [
      step("chainReach", { kind: "universe", count: 3 }, 300, 200),
      step("chainSalvage", { kind: "salvage", count: 3 }, 200, 120),
      step("chainBounty", { kind: "bounty", count: 5 }, 250, 150),
    ],
  },
  {
    id: "devops",
    steps: [
      step("devopsReach", { kind: "universe", count: 4 }, 350, 220),
      step("devopsSalvage", { kind: "salvage", count: 2 }, 220, 140),
      step("devopsRescue", { kind: "rescue", count: 1 }, 250, 150),
    ],
  },
  {
    id: "casino",
    steps: [
      step("casinoReach", { kind: "universe", count: 5 }, 400, 250),
      step("casinoSurvive", { kind: "survive", hazard: "any" }, 250, 150),
      step("casinoBoss", { kind: "boss", count: 1 }, 400, 300),
    ],
  },
  {
    id: "mmo",
    steps: [
      step("mmoReach", { kind: "universe", count: 6 }, 500, 300),
      step("mmoBoss", { kind: "boss", count: 1 }, 500, 350),
      step("mmoLand", { kind: "landAway" }, 300, 200),
    ],
  },
  {
    id: "beyond",
    steps: [step("beyondReach", { kind: "universe", count: 7 }, 800, 600)],
  },
];

// A pilot at the start of the story.
export const newStory = (): StoryProgress => ({ chapter: 0, progress: STORY[0].steps.map(() => 0) });

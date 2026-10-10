import { MISSIONS, missionMarks } from "@/packages/games/voyage";

const board = (ids: string[], done: string[] = []) => ids.map((id) => {
  const mission = MISSIONS.find((spec) => spec.id === id);

  if (!mission) {
    throw new Error(`no mission ${id}`);
  }

  return { mission, progress: done.includes(id) ? 1 : 0, target: 1 };
});

describe("games/voyage mission marks", () => {
  test("the map marks the worlds to land on or reach, how near the Sun to fly, wrecks, the way on and who to bring down", () => {
    expect(missionMarks(board(["landMoon", "reachMars", "sunHalf"]))).toEqual({ bodies: ["moon", "mars"], sunAu: [0.5], wrecks: false, wayOn: false, hostiles: false });
    expect(missionMarks(board(["salvageOne", "firstUniverse", "bountyFive"]))).toEqual({ bodies: [], sunAu: [], wrecks: true, wayOn: true, hostiles: true });
  });

  test("a mission done marks nothing, and missions with no place (crafting, upgrades) mark nothing", () => {
    expect(missionMarks(board(["landMoon", "craftOne", "upgradeThree"], ["landMoon"]))).toEqual({ bodies: [], sunAu: [], wrecks: false, wayOn: false, hostiles: false });
  });
});

import { MissionGoal, MissionSpec } from "../domain/career";

const mission = (id: string, goal: MissionGoal, xp: number, coin: number, minRank = 0): MissionSpec => ({ id, goal, xp, coin, minRank });

// The missions, in the order they are offered: the solar system first, then the black hole and the universes,
// then the deep, each from the rank that can manage it. Three are on the board at a time.
export const MISSIONS: readonly MissionSpec[] = [
  mission("landMoon", { kind: "land", body: "moon" }, 60, 40),
  mission("reachMars", { kind: "reach", place: "mars" }, 50, 30),
  mission("salvageOne", { kind: "salvage", count: 1 }, 50, 30),
  mission("sunHalf", { kind: "sun", au: 0.5 }, 80, 50),
  mission("landMars", { kind: "land", body: "mars" }, 80, 50),
  mission("skimGiant", { kind: "skim", count: 1 }, 90, 60),
  mission("saveWorld", { kind: "rescue", count: 1 }, 100, 60),
  mission("craftOne", { kind: "craft", count: 1 }, 60, 40),
  mission("reachPluto", { kind: "reach", place: "pluto" }, 120, 80, 1),
  mission("firstUniverse", { kind: "universe", count: 1 }, 150, 100, 1),
  mission("bountyFive", { kind: "bounty", count: 5 }, 150, 100, 1),
  mission("upgradeThree", { kind: "upgrade", level: 3 }, 120, 0, 1),
  mission("landVenus", { kind: "land", body: "venus" }, 200, 150, 2),
  mission("sunFifth", { kind: "sun", au: 0.2 }, 200, 150, 2),
  mission("salvageFive", { kind: "salvage", count: 5 }, 160, 100, 2),
  mission("bossOne", { kind: "boss", count: 1 }, 300, 200, 2),
  mission("surviveStorm", { kind: "survive", hazard: "storm" }, 120, 80, 1),
  mission("surviveSupernova", { kind: "survive", hazard: "supernova" }, 300, 200, 3),
  mission("surviveBurst", { kind: "survive", hazard: "burst" }, 300, 200, 3),
  mission("wormhole", { kind: "wormhole" }, 200, 120, 3),
  mission("thirdUniverse", { kind: "universe", count: 3 }, 300, 200, 3),
  mission("landTitan", { kind: "land", body: "titan" }, 220, 150, 3),
  mission("scoreFiveThousand", { kind: "score", points: 5000 }, 250, 150, 3),
  mission("upgradeTen", { kind: "upgrade", level: 10 }, 400, 0, 4),
  mission("bossThree", { kind: "boss", count: 3 }, 500, 400, 4),
  mission("sixthUniverse", { kind: "universe", count: 6 }, 600, 500, 5),
  mission("sunCorona", { kind: "sun", au: 0.08 }, 600, 400, 5),
  mission("upgradeTwenty", { kind: "upgrade", level: 20 }, 1000, 0, 6),
];

// Once every mission is done, contracts keep coming, each a little bigger than the last.
export const CONTRACT_KINDS: ReadonlyArray<"salvage" | "bounty" | "rescue"> = ["salvage", "bounty", "rescue"];

export const contractFor = (index: number): MissionSpec => {
  const kind = CONTRACT_KINDS[index % CONTRACT_KINDS.length];

  return contract(kind, (kind === "rescue" ? 2 : 4) + Math.floor(index / CONTRACT_KINDS.length) * 2);
};

// A contract, wholly from its kind and size, so its id is all that need be kept.
const contract = (kind: (typeof CONTRACT_KINDS)[number], count: number): MissionSpec => ({
  id: `contract:${kind}:${count}`,
  goal: { kind, count },
  xp: 40 * count,
  coin: 25 * count,
  minRank: 0,
});

// A mission by its id: one of the list, or a contract read back from its id.
export const missionById = (id: string): MissionSpec | null => {
  const listed = MISSIONS.find((spec) => spec.id === id);

  if (listed) {
    return listed;
  }

  const [prefix, kind, size] = id.split(":");
  const count = Number(size);
  const known = CONTRACT_KINDS.find((option) => option === kind);

  return prefix === "contract" && known && Number.isInteger(count) && count > 0 ? contract(known, count) : null;
};

// How many missions are on the board at once.
export const BOARD_SIZE = 3;

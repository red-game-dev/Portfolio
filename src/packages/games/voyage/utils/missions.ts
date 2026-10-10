import { CareerView } from "../career/domain/career";

// Where the missions on the board send the pilot, for the map to mark: worlds to land on or reach, how near the Sun
// to fly, wrecks to salvage, the way on (the black hole past the edge, or a universe's holes), and hostiles or a
// boss to bring down. The pilot may follow them or fly free.
export interface MissionMarks {
  bodies: string[];
  sunAu: number[];
  wrecks: boolean;
  wayOn: boolean;
  hostiles: boolean;
}

export const NO_MISSION_MARKS: MissionMarks = { bodies: [], sunAu: [], wrecks: false, wayOn: false, hostiles: false };

// The marks for the missions still under way.
export const missionMarks = (missions: CareerView["missions"]): MissionMarks => {
  const marks: MissionMarks = { bodies: [], sunAu: [], wrecks: false, wayOn: false, hostiles: false };

  missions.filter(({ progress, target }) => progress < target).forEach(({ mission: { goal } }) => {
    if (goal.kind === "land") {
      marks.bodies.push(goal.body);
    } else if (goal.kind === "reach") {
      marks.bodies.push(goal.place);
    } else if (goal.kind === "sun") {
      marks.sunAu.push(goal.au);
    } else if (goal.kind === "salvage") {
      marks.wrecks = true;
    } else if (goal.kind === "universe" || goal.kind === "wormhole") {
      marks.wayOn = true;
    } else if (goal.kind === "bounty" || goal.kind === "boss") {
      marks.hostiles = true;
    }
  });

  return marks;
};

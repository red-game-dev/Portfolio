import { CareerEvent, MissionGoal } from "../domain/career";

// How much a mission asks before it is done: a count, a level or a number of universes, otherwise once.
export const targetOf = (goal: MissionGoal): number => {
  switch (goal.kind) {
    case "skim":
    case "salvage":
    case "bounty":
    case "rescue":
    case "boss":
    case "universe":
    case "craft":
      return goal.count;
    case "upgrade":
      return goal.level;
    default:
      return 1;
  }
};

// How far a mission is along after something happens.
export const advance = (goal: MissionGoal, progress: number, event: CareerEvent): number => {
  const once = (isMet: boolean) => (isMet ? 1 : progress);

  switch (goal.kind) {
    case "land":
      return once(event.kind === "landed" && event.body === goal.body);
    case "reach":
      return once((event.kind === "passed" && event.place === goal.place) || (event.kind === "landed" && event.body === goal.place));
    case "sun":
      return once(event.kind === "sun" && event.au <= goal.au);
    case "skim":
      return event.kind === "skimmed" ? progress + 1 : progress;
    case "salvage":
      return event.kind === "salvaged" ? progress + 1 : progress;
    case "bounty":
      return event.kind === "bounty" ? progress + 1 : progress;
    case "rescue":
      return event.kind === "rescue" ? progress + 1 : progress;
    case "boss":
      return event.kind === "boss" ? progress + 1 : progress;
    case "craft":
      return event.kind === "crafted" ? progress + 1 : progress;
    case "universe":
      return event.kind === "universe" ? Math.max(progress, event.count) : progress;
    case "upgrade":
      return event.kind === "upgraded" ? Math.max(progress, event.level) : progress;
    case "survive":
      return once(event.kind === "survived" && event.hazard === goal.hazard);
    case "wormhole":
      return once(event.kind === "wormhole");
    case "score":
      return once(event.kind === "score" && event.points >= goal.points);
    default:
      return progress;
  }
};

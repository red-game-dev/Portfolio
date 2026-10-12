import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// A place's name: ours from the content, a made one as the universe named it.
export const placeName = (content: FinaleVoyage, id: string, madeName?: string | null) => content.stops[id] ?? madeName ?? id;

// A piece's name from its kind ("armor:2" reads "Alloy Plating", "weapon:missile:1" "Titanium Missile pod").
export const pieceName = (content: FinaleVoyage, base: string): string => {
  const copy = content.gear;
  const [first, second, third] = base.split(":");
  const isWeapon = first === "weapon";
  const grade = copy.grades[Number(isWeapon ? third : second)] ?? "";
  const weapons: Record<string, { name: string } | undefined> = copy.weapons;
  const slots: Record<string, string | undefined> = copy.slots;
  const piece = isWeapon ? weapons[second]?.name ?? second : slots[first] ?? first;

  return fill(copy.pieceName, { grade, piece });
};

// A mission's name: one of the list by its id, or a contract read from its id ("contract:salvage:6").
export const missionName = (content: FinaleVoyage, id: string): string => {
  const copy = content.career;
  const [prefix, kind, count] = id.split(":");

  if (prefix === "contract" && (kind === "salvage" || kind === "bounty" || kind === "rescue")) {
    return fill(copy.contracts[kind], { count });
  }

  return copy.missions[id] ?? id;
};

// A step of the story, and a chapter's title.
export const storyStepName = (content: FinaleVoyage, id: string): string => content.career.story.steps[id] ?? id;

export const chapterTitle = (content: FinaleVoyage, id: string): string => content.career.story.chapters[id]?.title ?? id;

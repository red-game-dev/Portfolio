import { isBoostName } from "@/components/Finale/Voyage/abilities";
import { chapterTitle, missionName, storyStepName } from "@/components/Finale/Voyage/names";
import type { CodexEntry, VoyageNotice } from "@/packages/games/voyage";
import { capitalise, fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";


export { chapterTitle, missionName, storyStepName };

export const rankName = (content: FinaleVoyage, id: string): string => content.career.ranks[id] ?? id;

// What the cards say of the daily voyage: a run's result at its end, and today's best before a run, each score written
// as the card writes the run's own.
export const dailyResult = (content: FinaleVoyage, score: number): string => fill(content.career.daily.result, { score: formatNumber(score) });

export const dailyNote = (content: FinaleVoyage, best: number): string => (best > 0
  ? `${content.career.daily.note} ${fill(content.career.daily.best, { score: formatNumber(best) })}`
  : content.career.daily.note);

// What a codex entry is called, from whichever part of the content names its subject.
export const codexName = (content: FinaleVoyage, { category, subject }: Pick<CodexEntry, "category" | "subject">): string => {
  const copy = content.career;

  switch (category) {
    case "worlds":
      return capitalise(content.stops[subject] ?? subject);
    case "kinds":
      return copy.kinds[subject]?.name ?? subject;
    case "universes":
      return copy.universes[subject]?.name ?? subject;
    case "galaxies":
      return copy.galaxies[subject]?.name ?? subject;
    case "stars":
      return copy.stars[subject]?.name ?? subject;
    case "phenomena":
      return copy.phenomena[subject]?.name ?? subject;
    case "life":
      return copy.life[subject]?.name ?? subject;
    case "wrecks": {
      const wrecks: Record<string, string | undefined> = content.economy.salvage.wrecks;

      return capitalise(wrecks[subject] ?? subject);
    }
    case "things":
      return content.economy.items[subject]?.name ?? subject;
    case "boosts":
      return isBoostName(content.boosts.names, subject) ? content.boosts.names[subject] : subject;
    default:
      return subject;
  }
};

// A line about it, or its real figures for our own worlds.
export const codexNotes = (content: FinaleVoyage, entry: CodexEntry): string[] => {
  const copy = content.career;
  const { facts } = entry;

  if (facts) {
    const isStar = entry.subject === "sun";

    return [
      fill(copy.facts.radius, { value: formatNumber(facts.radiusKm) }),
      fill(copy.facts.gravity, { value: formatNumber(facts.gravity, 2) }),
      facts.dayHours === null ? copy.facts.locked : fill(copy.facts.day, { value: formatNumber(Math.abs(facts.dayHours), 1) }),
      ...(facts.pressureBar !== null ? [fill(copy.facts.pressure, { value: formatNumber(facts.pressureBar, facts.pressureBar < 1 ? 3 : 0) })] : []),
      isStar
        ? fill(copy.facts.surface, { day: formatNumber(facts.dayC) })
        : fill(copy.facts.temperature, { day: formatNumber(facts.dayC), night: formatNumber(facts.nightC) }),
    ];
  }

  switch (entry.category) {
    case "kinds":
      return [copy.kinds[entry.subject]?.note ?? ""];
    case "universes":
      return [copy.universes[entry.subject]?.note ?? ""];
    case "galaxies":
      return [copy.galaxies[entry.subject]?.note ?? ""];
    case "stars":
      return [copy.stars[entry.subject]?.note ?? ""];
    case "phenomena":
      return [copy.phenomena[entry.subject]?.note ?? ""];
    case "life":
      return [copy.life[entry.subject]?.note ?? ""];
    case "wrecks":
      return [copy.wreckNotes[entry.subject] ?? ""];
    case "things":
      return [content.economy.items[entry.subject]?.note ?? ""];
    case "boosts":
      return isBoostName(content.boosts.names, entry.subject) ? [content.boosts.notes[entry.subject]] : [];
    default:
      return [];
  }
};

// The card a quest done shows: what kind of quest, its name, what it paid, and for a chapter told the line it decoded
// to. Null for anything else.
export interface QuestCard {
  title: string;
  name: string;
  xp: number;
  coin: number;
  line: string | null;
}

export const questCard = (content: FinaleVoyage, notice: VoyageNotice): QuestCard | null => {
  const words = content.hangar.quests.card;

  switch (notice.kind) {
    case "missionDone":
      return { title: words.mission, name: missionName(content, notice.mission), xp: notice.xp, coin: notice.coin, line: null };
    case "storyStep":
      return { title: words.step, name: storyStepName(content, notice.step), xp: notice.xp, coin: notice.coin, line: null };
    case "storyChapter":
      return { title: words.chapter, name: chapterTitle(content, notice.chapter), xp: 0, coin: 0, line: content.career.story.chapters[notice.chapter]?.line ?? null };
    default:
      return null;
  }
};

// What to say when the career moves: a mission or a step of the story done, a chapter told (the line it decodes to),
// the chapter under way (how it opens, or that the story is all told), a promotion, something new in the codex. Null
// otherwise.
export const careerNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const copy = content.career;

  switch (notice.kind) {
    case "missionDone":
      return fill(notice.coin > 0 ? copy.missionDone : copy.missionDoneXp, { mission: missionName(content, notice.mission), xp: notice.xp, coin: notice.coin });
    case "storyStep":
      return fill(copy.story.stepDone, { step: storyStepName(content, notice.step), xp: notice.xp, coin: notice.coin });
    case "storyChapter":
      return fill(copy.story.chapterDone, { chapter: chapterTitle(content, notice.chapter), line: copy.story.chapters[notice.chapter]?.line ?? "" });
    case "storyOpened":
      return notice.chapter
        ? fill(copy.story.opened, { chapter: chapterTitle(content, notice.chapter), intro: copy.story.chapters[notice.chapter]?.intro ?? "" })
        : copy.story.told;
    case "promoted":
      return fill(copy.promoted, { rank: rankName(content, notice.rank) });
    case "discovered": {
      const [category, ...rest] = notice.entry.split(":");
      const subject = rest.join(":");

      return isCategory(category) ? fill(copy.discovered, { name: codexName(content, { category, subject }) }) : null;
    }
    default:
      return null;
  }
};

const CATEGORIES: ReadonlyArray<CodexEntry["category"]> = ["worlds", "kinds", "universes", "galaxies", "stars", "phenomena", "life", "wrecks", "things", "boosts"];

const isCategory = (value: string): value is CodexEntry["category"] => CATEGORIES.some((category) => category === value);

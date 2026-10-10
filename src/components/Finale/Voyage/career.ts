import type { CodexEntry, VoyageNotice } from "@/packages/games/voyage";
import { capitalise, fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";


// A mission's name: one of the list by its id, or a contract read from its id ("contract:salvage:6").
export const missionName = (content: FinaleVoyage, id: string): string => {
  const copy = content.career;
  const [prefix, kind, count] = id.split(":");

  if (prefix === "contract" && (kind === "salvage" || kind === "bounty" || kind === "rescue")) {
    return fill(copy.contracts[kind], { count });
  }

  return copy.missions[id] ?? id;
};

export const rankName = (content: FinaleVoyage, id: string): string => content.career.ranks[id] ?? id;

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
    default:
      return [];
  }
};

// What to say when the career moves: a mission done, a promotion, something new in the codex. Null otherwise.
export const careerNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const copy = content.career;

  switch (notice.kind) {
    case "missionDone":
      return fill(notice.coin > 0 ? copy.missionDone : copy.missionDoneXp, { mission: missionName(content, notice.mission), xp: notice.xp, coin: notice.coin });
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

const CATEGORIES: ReadonlyArray<CodexEntry["category"]> = ["worlds", "kinds", "universes", "galaxies", "stars", "phenomena", "life", "wrecks", "things"];

const isCategory = (value: string): value is CodexEntry["category"] => CATEGORIES.some((category) => category === value);

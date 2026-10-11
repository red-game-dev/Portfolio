import { placeName } from "@/components/Finale/Voyage/names";
import type { SkyEvent, VoyageNotice } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// A sky event by its id ("shower:perseids", "conjunction:mars:jupiter", "opposition:saturn") in words: a shower with
// its parent comet and whether it peaks, two planets together, a planet opposite the Sun.
export const skyLine = (content: FinaleVoyage, id: string, isPeak = false): string => {
  const copy = content.sky;
  const [kind, first = "", second = ""] = id.split(":");

  if (kind === "shower") {
    const shower = copy.showers[first];

    return fill(copy.shower, { name: shower?.name ?? first, parent: shower?.parent ?? "", peak: isPeak ? copy.peak : "" });
  }

  if (kind === "conjunction") {
    return fill(copy.conjunction, { first: placeName(content, first), second: placeName(content, second) });
  }

  return fill(copy.opposition, { planet: placeName(content, first) });
};

// The short name of a sky event, for a badge: a shower's name, or the line for an alignment.
export const skyName = (content: FinaleVoyage, id: string): string => {
  const [kind, first = ""] = id.split(":");

  return kind === "shower" ? content.sky.showers[first]?.name ?? first : skyLine(content, id);
};

// Today's events, each in words.
export const skyLines = (content: FinaleVoyage, events: readonly SkyEvent[]): string[] => events.map((event) => skyLine(content, event.id, event.isPeak));

// A badge for a sky event flown under, from its kept key ("shower:perseids:2026"): its name and the year.
export const skyBadge = (content: FinaleVoyage, key: string): string => {
  const year = key.slice(key.lastIndexOf(":") + 1);

  return fill(content.sky.seenYear, { line: skyName(content, key.slice(0, key.lastIndexOf(":"))), year });
};

// What to say when a run is flown under something in the real sky.
export const skyNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => (notice.kind === "sky"
  ? fill(content.sky.flew, { line: skyName(content, notice.event) })
  : null);

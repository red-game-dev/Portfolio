import { SECTION_IDS } from "@/config/sections";
import { ZoneId } from "@/config/zones";

export type StopKey = "who" | "offer" | "history" | "ai" | "web3" | "engineering" | "igaming" | "game" | "beyond";

// One stop of the journey: the run of sections it covers, in page order, and the zone it belongs to.
export interface JourneyStop {
  key: StopKey;
  // The first section of the stop. Several ids for a stop that starts at a section only some views render;
  // the first one present is used.
  first: string | string[];
  last: string;
  // Links to the last of `first`, the section every view renders.
  href: string;
  zone: ZoneId;
}

const stop = (key: StopKey, zone: ZoneId, first: string | string[], last: string): JourneyStop => {
  const ids = Array.isArray(first) ? first : [first];

  return { key, zone, first, last, href: `#${ids[ids.length - 1]}` };
};

// The menus, the scroll spy and the SEO breadcrumb all follow these stops. Their names are content
// (menu.stops in the data).
export const JOURNEY_STOPS: JourneyStop[] = [
  stop("who", "matrix", [SECTION_IDS.glance, SECTION_IDS.about], SECTION_IDS.terminal),
  stop("offer", "matrix", SECTION_IDS.services, SECTION_IDS.services),
  stop("history", "matrix", SECTION_IDS.history, SECTION_IDS.history),
  stop("ai", "ai", SECTION_IDS.aiUsage, SECTION_IDS.aiUsage),
  stop("web3", "chain", SECTION_IDS.web3, SECTION_IDS.web3),
  stop("engineering", "chain", SECTION_IDS.skillAreas, SECTION_IDS.codeReview),
  stop("igaming", "casino", SECTION_IDS.igaming, SECTION_IDS.igaming),
  stop("game", "mmo", SECTION_IDS.roster, SECTION_IDS.arena),
  stop("beyond", "beyond", SECTION_IDS.finale, SECTION_IDS.timelapse),
];

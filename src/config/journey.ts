import { PAYMENT_DRAWING_ANCHORS, PAYMENT_DRAWINGS, PaymentDrawingKey } from "@/config/payments";
import { SECTION_IDS } from "@/config/sections";
import type { SectionThemeId } from "@/config/sectionThemes";
import { ZoneId } from "@/config/zones";

export type StopKey = "who" | "offer" | "history" | "ai" | "web3" | "payments" | "engineering" | "igaming" | "game" | "beyond";

export type StopPartKey = PaymentDrawingKey | "skills" | "caseStudies" | "projects" | "recommendations" | "arena";

// A section inside a long stop that a reader may look for by name, or a place inside one (a drawing a link
// opens by name), linked straight from the menu.
export interface StopPart {
  key: StopPartKey;
  href: string;
  // The section it is in.
  section: string;
}

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
  parts?: StopPart[];
  // A stop that is one section with a theme of its own takes that theme's colour in the menus.
  theme?: SectionThemeId;
}

const part = (key: StopPartKey, id: string, section = id): StopPart => ({ key, href: `#${id}`, section });

const stop = (key: StopKey, zone: ZoneId, first: string | string[], last: string, parts?: StopPart[], theme?: SectionThemeId): JourneyStop => {
  const ids = Array.isArray(first) ? first : [first];

  return { key, zone, first, last, href: `#${ids[ids.length - 1]}`, ...(parts ? { parts } : {}), ...(theme ? { theme } : {}) };
};

// The menus, the scroll spy and the SEO breadcrumb all follow these stops. Their names are content
// (menu.stops in the data).
export const JOURNEY_STOPS: JourneyStop[] = [
  stop("who", "matrix", [SECTION_IDS.glance, SECTION_IDS.about], SECTION_IDS.terminal),
  stop("offer", "matrix", SECTION_IDS.services, SECTION_IDS.services),
  stop("history", "matrix", SECTION_IDS.history, SECTION_IDS.history),
  stop("ai", "ai", SECTION_IDS.aiUsage, SECTION_IDS.aiUsage),
  stop("web3", "chain", SECTION_IDS.web3, SECTION_IDS.web3),
  // One section, its drawings each linked by name: a link opens that drawing.
  stop("payments", "chain", SECTION_IDS.payments, SECTION_IDS.payments,
    PAYMENT_DRAWINGS.map((drawing) => part(drawing, PAYMENT_DRAWING_ANCHORS[drawing], SECTION_IDS.payments)), "payments"),
  stop("engineering", "chain", SECTION_IDS.skillAreas, SECTION_IDS.codeReview),
  stop("igaming", "casino", SECTION_IDS.igaming, SECTION_IDS.igaming),
  // The longest stop, and the one a recruiter looks inside by name: its parts are linked from the menu too.
  stop("game", "mmo", SECTION_IDS.roster, SECTION_IDS.arena, [
    part("skills", SECTION_IDS.forge),
    part("caseStudies", SECTION_IDS.caseStudies),
    part("projects", SECTION_IDS.projects),
    part("recommendations", SECTION_IDS.recommendations),
    part("arena", SECTION_IDS.arena),
  ]),
  stop("beyond", "beyond", SECTION_IDS.finale, SECTION_IDS.timelapse),
];

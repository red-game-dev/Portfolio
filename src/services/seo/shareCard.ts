import { SITE_URL } from "@/config/site";
import { ZONE_ACCENTS, ZONE_BOUNDARIES, ZoneId } from "@/config/zones";
import { PortfolioData } from "@/data/resume";
import { hexHash } from "@/packages/encoding/hash";
import { DetailFigure, DetailFigureId } from "@/types/details";

export interface ShareCardZone {
  id: ZoneId;
  name: string;
  accent: string;
}

// What the share card says, read once from the content for every place that draws it: the picture the site draws on
// request (shareImage) and the film recorded from /social-card/.
export interface ShareCardContent {
  name: string;
  role: string;
  availability: string;
  figures: DetailFigure[];
  zones: ShareCardZone[];
  domain: string;
}

// The figures the card shows, picked by id, so a changed figure changes the card.
const FIGURE_IDS: readonly DetailFigureId[] = ["industry", "reach", "startups"];

export const shareCardOf = (data: PortfolioData): ShareCardContent => ({
  name: data.details.name,
  role: data.cvDocument.headline,
  availability: data.headline.availability,
  figures: FIGURE_IDS.flatMap((id) => data.details.proof.filter((figure) => figure.id === id)),
  zones: ZONE_BOUNDARIES.map(({ zone }) => ({ id: zone, name: data.journeyTrail.zones[zone], accent: ZONE_ACCENTS[zone] })),
  domain: SITE_URL.replace(/^https?:\/\/(www\.)?/, ""),
});

// The picture's drawing (shareImage.tsx, its fonts, the stars' colours): bumped whenever it changes, so the version moves
// with it; a test holds this number to those files.
export const SHARE_CARD_DESIGN = 1;

// Changes only when what the card says or how it is drawn changes, so a platform that keeps the picture by its address
// fetches it again then, and not on every deploy.
export const shareCardVersion = (card: ShareCardContent): string => hexHash(JSON.stringify({ design: SHARE_CARD_DESIGN, card }), 8);

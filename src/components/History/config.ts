import { ZONE_ACCENTS } from "@/config/zones";

// Ventures of my own are drawn in the game world's gold, apart from the employed work in the zone's accent.
export const VENTURE_COLOUR = ZONE_ACCENTS.mmo;

export const HISTORY_VIEW = {
  // Bullets shown before "Show more".
  previewBullets: 3,
  // The guided view keeps one bullet in sight, the quick view none.
  productPreviewBullets: 1,
  // Stack tags the quick view shows without opening the card.
  recruiterStackPreview: 10,
} as const;

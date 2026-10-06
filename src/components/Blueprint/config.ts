// Up to 1200px wide on large screens, centred on the column, so four frames of boxes fit without squeezing.
// 80px stay clear on each side for the zone trail and the social rail fixed at the edges.
export const BLEED = "calc((100% - min(1200px, 100vw - 160px)) / 2)";

// Drawings and their code are fetched once they come within a screen of view.
export const NEAR_MARGIN = "100% 0px";

// Room held for a showcase before its drawings arrive, so the page below barely moves when they do.
export const PLACEHOLDER_HEIGHT = 520;

// How long a tab switch plays.
export const SWITCH_MS = 650;

// The cells laid over a drawing as it lands: blocks for Web3, pixels for the game world.
export const BLOCK_GRID = { columns: 8, rows: 4 } as const;
export const PIXEL_GRID = { columns: 16, rows: 8 } as const;

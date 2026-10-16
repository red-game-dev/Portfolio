import type { SectionThemeId } from "@/config/themes";
import { ZoneId } from "@/config/zones";
import { BlueprintMotion } from "@/types/blueprints";

// How long a switch plays.
export const SWITCH_MS = 650;

// A payment's switch tells a short story (the card goes to the terminal, then it is approved), so it plays
// longer. It never takes a press: the content under it can be used from the start.
export const PAYMENT_SWITCH_MS = 1200;

// The cells laid over the new content as it lands: blocks for Web3, pixels for the game world.
export const BLOCK_GRID = { columns: 8, rows: 4 } as const;
export const PIXEL_GRID = { columns: 16, rows: 8 } as const;

// Each universe switches content its own way. AI: a neural beam scans the new content in. Web3: blocks
// confirm one after another in a diagonal wave. Casino: the content is dealt and flipped like a card.
// Game world: a retro pixel dissolve. Engineering: a terminal refreshes top to bottom. Beyond: the content
// drops out of warp, a little far and bright, and settles. Reduced motion just swaps.
export type ZoneEffect = "beam" | "blocks" | "deal" | "pixels" | "scan" | "warp";

// The payments drawings switch their own way: a showcase opens each with its subject (its motion), and
// inside one the tabs switch with the next way to pay at the terminal ("pay").
export type PaymentEffect = BlueprintMotion | "pay";

// A section with a theme of its own (config/themes.ts) switches by its subject: what I have built is drafted like a
// blueprint, a delivery pipeline lights stage by stage for the skills by area, a diff applies for the code review.
export type ThemeEffect = "draft" | "pipeline" | "diff";

export type SwitchEffect = ZoneEffect | PaymentEffect | ThemeEffect;

// How long a theme's switch plays: a little longer than a zone's, since each tells a small story.
export const THEME_SWITCH_MS = 820;

// Where a theme's subject has a switch of its own; Web3 keeps its zone's blocks, and the payments drawings
// bring theirs (their `motion`).
export const THEME_EFFECTS: Partial<Record<SectionThemeId, ZoneEffect | ThemeEffect>> = {
  web3: "blocks",
  skillAreas: "pipeline",
  platform: "draft",
  codeReview: "diff",
};

const THEME_EFFECT_SET: ReadonlySet<SwitchEffect> = new Set<SwitchEffect>(["draft", "pipeline", "diff"]);

export const isThemeEffect = (effect: SwitchEffect): effect is ThemeEffect => THEME_EFFECT_SET.has(effect);

export const ZONE_EFFECTS: Record<ZoneId, ZoneEffect> = {
  ai: "beam",
  chain: "blocks",
  casino: "deal",
  mmo: "pixels",
  matrix: "scan",
  beyond: "warp",
};

// The effect a switch plays: the one of the zone it sits in.
export const switchEffectFor = (zone: ZoneId): ZoneEffect => ZONE_EFFECTS[zone];

const ZONE_EFFECT_SET: ReadonlySet<SwitchEffect> = new Set(Object.values(ZONE_EFFECTS));

export const isPaymentEffect = (effect: SwitchEffect): effect is PaymentEffect => !ZONE_EFFECT_SET.has(effect) && !isThemeEffect(effect);

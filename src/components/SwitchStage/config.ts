import type { SectionThemeId } from "@/config/sectionThemes";
import { ZoneId } from "@/config/zones";
import { BlueprintMotion } from "@/types/blueprints";
import { SkillAreaUniverse } from "@/types/skills";

// How long a switch plays.
export const SWITCH_MS = 650;

// A payment's switch tells a short story (the card goes to the terminal, then it is approved), so it plays
// longer. It never takes a press: the content under it can be used from the start.
export const PAYMENT_SWITCH_MS = 1400;

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

// A section with a theme of its own (config/sectionThemes.ts) switches by its subject where its content switches: what
// I have built is drafted item by item like a plan; More Skills by Area's drawings boot up like a live system, each
// box powering on in turn and its wires after; and each skill area switches in the way of the universe it belongs to
// on the journey (AREA_EFFECTS). All of them animate the content's own items (marked data-switch-item, each with its
// place as --i): tiles and skills, and a drawing's boxes, overview rows, screens and journeys.
export type ThemeEffect = "draft" | "boot" | AreaEffect;

// The skill areas' switches, one per universe: mined as blocks into a chain (Web3), dealt face down from the tab and
// flipped (the casino), popped in as 8-bit pixels (the game world), lit by the neural beam as it passes (AI), printed
// out of a till's slot (payments), typed out behind a block cursor (the engineering terminal), and dropped out of warp
// (beyond).
export type AreaEffect = "mined" | "dealt" | "pixel" | "beamed" | "printed" | "typed" | "warped";

export const AREA_EFFECTS: Record<SkillAreaUniverse, AreaEffect> = {
  chain: "mined",
  casino: "dealt",
  mmo: "pixel",
  ai: "beamed",
  payments: "printed",
  matrix: "typed",
  beyond: "warped",
};

export type SwitchEffect = ZoneEffect | PaymentEffect | ThemeEffect;

// Where a theme's subject has a switch of its own; Web3 keeps its zone's blocks, and the payments drawings
// bring theirs (their `motion`).
export const THEME_EFFECTS: Partial<Record<SectionThemeId, ZoneEffect | ThemeEffect>> = {
  web3: "blocks",
  skillAreas: "boot",
  platform: "draft",
};

const THEME_EFFECT_SET: ReadonlySet<SwitchEffect> = new Set<SwitchEffect>(["draft", "boot", ...Object.values(AREA_EFFECTS)]);

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

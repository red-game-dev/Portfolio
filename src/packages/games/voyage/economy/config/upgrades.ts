import { Cost, HullTier } from "../domain/economy";
import { ItemStack, stack } from "../domain/items";
import { markOf, MAX_LEVEL, TIERS, tierOf } from "./tiers";

// What each hull is built from: salvage for the rocket, then each of the site's universes in turn, and the deep
// past them for the greatest, so a pilot has to go and find them.
export const TIER_MATERIALS: Readonly<Record<HullTier, readonly ItemStack[]>> = {
  rocket: [stack("scrap", 3), stack("wiring", 1)],
  shuttle: [stack("titanium", 2), stack("circuits", 1), stack("carbon", 1), stack("codeShards", 1)],
  corvette: [stack("alloy", 2), stack("circuits", 2), stack("synapseGel", 1), stack("hashCrystals", 1)],
  starship: [stack("alloy", 3), stack("plasma", 2), stack("luckyChips", 1), stack("pixelDust", 1)],
  intergalactic: [stack("exotic", 1), stack("plasma", 3), stack("stardust", 1), stack("voidEssence", 1)],
  titan: [stack("exotic", 2), stack("abyssPearl", 1), stack("emberCore", 1), stack("crystalShards", 1), stack("voidEssence", 2)],
};

// Red Coin for the first upgrade, and how much more each one after costs.
const BASE_COIN = 50;
const COIN_GROWTH = 1.25;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

// What it costs to reach a level from the one below: Red Coin growing a quarter each level; Void Shards from the
// Corvette on, more for a new hull; the hull's materials, more for each mark; and a new hull's blueprint.
export const upgradeCost = (level: number): Cost | null => {
  if (level < 1 || level > MAX_LEVEL) {
    return null;
  }

  const tier = tierOf(level);
  const mark = markOf(level);
  const tierIndex = TIERS.indexOf(tier);
  const isNewHull = mark === 1;
  const scale = 0.6 + 0.4 * mark;

  return {
    coin: {
      RED: roundTo(BASE_COIN * COIN_GROWTH ** level, 5),
      VOID: tierIndex >= 2 ? (tierIndex - 1) * (isNewHull ? 3 : 1) : 0,
    },
    items: TIER_MATERIALS[tier].map(({ id, count }) => stack(id, Math.ceil(count * scale))),
    blueprint: isNewHull ? `hull:${tier}` : null,
  };
};

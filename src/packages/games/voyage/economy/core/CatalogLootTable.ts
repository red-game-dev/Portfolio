import type { RandomSource } from "@/packages/math/random";

import { LootSituation, LootTable } from "../../domain/loot";
import { DEEP_STYLES } from "../../domain/theme";
import { pickWeighted, randomInt } from "../../utils/weighted";
import { AWAY_CHANCE, BLUEPRINT_DROPS, BOSS_WEIGHTS, ITEMS, RARITY_WEIGHTS, SOURCE_ROLLS } from "../config/catalog";
import { ItemSpec, ItemStack, Loot, RARITIES, Rarity } from "../domain/items";

// How many of one thing a find holds, by rarity.
const COUNTS: Readonly<Record<Rarity, [number, number]>> = { common: [1, 3], uncommon: [1, 2], rare: [1, 1], epic: [1, 1], legendary: [1, 1] };

// How likely a thing is where it was found: anything with no home is as likely anywhere it can be found; a
// universe's own material is found there, and, past the site's own universes, now and then elsewhere in the deep.
const chanceHere = (spec: ItemSpec, { source, style, universe }: LootSituation): number => {
  if (!spec.sources.includes(source) || (spec.minUniverse !== undefined && universe < spec.minUniverse)) {
    return 0;
  }

  if (!spec.style || spec.style === style) {
    return 1;
  }

  return style !== null && DEEP_STYLES.includes(style) ? AWAY_CHANCE : 0;
};

// The catalogue's answer to what is found: a few rolls by source, each a rarity by weight (a boss's hoard leans
// rare) and then a thing of that rarity that can be found here, stepping down a rarity when none can; some finds
// are empty, more often for rocks than wrecks and never for a boss; and now and then a blueprint, the greatest
// only on bosses deep in.
export class CatalogLootTable implements LootTable {
  constructor(private readonly catalog: Readonly<Record<string, ItemSpec>> = ITEMS) {}

  public roll(situation: LootSituation, random: RandomSource): Loot {
    const { rolls, empty } = SOURCE_ROLLS[situation.source];
    const blueprints = this.blueprints(situation, random);

    if (random() < empty) {
      return { items: [], blueprints };
    }

    const found = new Map<string, number>();
    const times = randomInt(random, rolls[0], rolls[1]) + (situation.source === "alien" && situation.level >= 8 ? 1 : 0);

    for (let index = 0; index < times; index += 1) {
      const stack = this.one(situation, random);

      if (stack) {
        found.set(stack.id, (found.get(stack.id) ?? 0) + stack.count);
      }
    }

    return { items: [...found.entries()].map(([id, count]) => ({ id, count })), blueprints };
  }

  private one(situation: LootSituation, random: RandomSource): ItemStack | null {
    const weights = situation.source === "boss" ? BOSS_WEIGHTS : RARITY_WEIGHTS;
    const rarity = pickWeighted(random, RARITIES, (option) => weights[option]);
    const specs = Object.values(this.catalog);

    for (let step = rarity ? RARITIES.indexOf(rarity) : 0; step >= 0; step -= 1) {
      const spec = pickWeighted(random, specs.filter((option) => option.rarity === RARITIES[step]), (option) => chanceHere(option, situation));

      if (spec) {
        const [min, max] = COUNTS[spec.rarity];

        return { id: spec.id, count: randomInt(random, min, max) };
      }
    }

    return null;
  }

  private blueprints({ source, universe }: LootSituation, random: RandomSource): string[] {
    return BLUEPRINT_DROPS.filter((drop) => drop.sources.includes(source) && universe >= drop.minUniverse && random() < drop.chance).map((drop) => drop.id);
  }
}



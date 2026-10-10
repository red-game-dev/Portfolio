import { clamp } from "@/packages/math/clamp";
import { pick, pickWeighted, RandomSource, randomInt } from "@/packages/math/random";

import { LootSituation, LootTable } from "../../domain/loot";
import { DEEP_STYLES } from "../../domain/theme";
import { AMMO_TYPES, GEAR_SLOTS, GRADES } from "../../gear/config/slots";
import { WEAPON_KINDS } from "../../gear/config/weapons";
import { AmmoStock, GearDrop } from "../../gear/domain/gear";
import { slotBaseId, weaponBaseId } from "../../gear/utils/gear";
import {
  AMMO_DROPS, AWAY_CHANCE, BLUEPRINT_DROPS, BOSS_WEIGHTS, GEAR_DROPS, ITEM_SOURCE, ITEMS, RARITY_WEIGHTS, SOURCE_ROLLS, WEAPON_SHARE,
} from "../config/catalog";
import { ItemSpec, ItemStack, Loot, RARITIES, Rarity } from "../domain/items";

// How many of one thing a find holds, by rarity.
const COUNTS: Readonly<Record<Rarity, [number, number]>> = { common: [1, 3], uncommon: [1, 2], rare: [1, 1], epic: [1, 1], legendary: [1, 1] };

// How likely a thing is where it was found: anything with no home is as likely anywhere it can be found; a
// universe's own material is found there, and, past the site's own universes, now and then elsewhere in the deep.
const chanceHere = (spec: ItemSpec, { source, style, universe }: LootSituation): number => {
  if (!spec.sources.includes(ITEM_SOURCE[source]) || (spec.minUniverse !== undefined && universe < spec.minUniverse)) {
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
    const gear = this.gear(situation, random);
    const ammo = this.ammo(situation, random);

    if (random() < empty) {
      return { items: [], blueprints, gear, ammo };
    }

    const found = new Map<string, number>();
    const times = randomInt(random, rolls[0], rolls[1]) + (situation.source === "alien" && situation.level >= 8 ? 1 : 0);

    for (let index = 0; index < times; index += 1) {
      const stack = this.one(situation, random);

      if (stack) {
        found.set(stack.id, (found.get(stack.id) ?? 0) + stack.count);
      }
    }

    return { items: [...found.entries()].map(([id, count]) => ({ id, count })), blueprints, gear, ammo };
  }

  // Pieces of gear: by the source's chance, a grade near how deep the find is (higher for each two universes past
  // the singularity), a rarity by weight (a boss's and a chest's lean rare), a weapon now and then.
  private gear({ source, universe }: LootSituation, random: RandomSource): GearDrop[] {
    const { chance, most } = GEAR_DROPS[source];
    const drops: GearDrop[] = [];
    const weights = source === "boss" || source === "chest" ? BOSS_WEIGHTS : RARITY_WEIGHTS;
    const depth = universe < 0 ? 0 : Math.min(GRADES - 1, 1 + Math.floor(universe / 2));

    for (let index = 0; index < most && random() < chance; index += 1) {
      const step = random();
      const grade = clamp(depth + (step < 0.2 ? 1 : step < 0.45 ? -1 : 0), 0, GRADES - 1);
      const rarity = pickWeighted(random, RARITIES, (option) => weights[option]) ?? "common";

      drops.push({ base: random() < WEAPON_SHARE ? weaponBaseId(pick(random, WEAPON_KINDS), grade) : slotBaseId(pick(random, GEAR_SLOTS), grade), rarity });
    }

    return drops;
  }

  // Ammunition: rounds for the main gun, and by the source's chance one kind for a weapon, or every kind in a
  // boss's hoard or a chest.
  private ammo({ source }: LootSituation, random: RandomSource): Partial<AmmoStock> {
    const drop = AMMO_DROPS[source];
    const found: Partial<AmmoStock> = {};

    if (drop.rounds[1] > 0) {
      found.rounds = randomInt(random, drop.rounds[0], drop.rounds[1]);
    }

    if (random() < drop.chance) {
      const kinds = drop.isEveryKind ? AMMO_TYPES.filter((type) => type !== "rounds") : [pick(random, AMMO_TYPES.filter((type) => type !== "rounds"))];

      kinds.forEach((type) => {
        found[type] = randomInt(random, drop.other[0], drop.other[1]) * (type === "shells" ? 4 : 1);
      });
    }

    return found;
  }

  private one(situation: LootSituation, random: RandomSource): ItemStack | null {
    const weights = situation.source === "boss" ? BOSS_WEIGHTS : RARITY_WEIGHTS;
    const rarity = pickWeighted(random, RARITIES, (option) => weights[option]);
    const specs = Object.values(this.catalog);

    const picked = rarity ? RARITIES.indexOf(rarity) : 0;
    // Down from the rarity drawn, then up past it, so a source with nothing of that rarity here still gives what
    // it can: a boss's hoard holds no salvage, so a common draw finds something rarer instead.
    const order = [...RARITIES.keys()].sort((first, second) => (first <= picked ? picked - first : 100 + first) - (second <= picked ? picked - second : 100 + second));

    for (const step of order) {
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



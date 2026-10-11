import { itemName } from "@/components/Finale/Voyage/economy";
import { pieceName } from "@/components/Finale/Voyage/gear";
import type { BarRow, BarSlot, BoostId, VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// Whether a name is one of the boosts, read from the content that names every one of them, so the dialog needs
// none of the game's code.
export const isBoostName = (names: Readonly<Record<BoostId, string>>, value: string): value is BoostId =>
  Object.prototype.hasOwnProperty.call(names, value);

// What a slot holds, by name (a weapon by its kind of piece).
export const slotName = (content: FinaleVoyage, slot: BarSlot, base: string | null = null): string => {
  if (slot.kind === "weapon") {
    return base ? pieceName(content, base) : content.gear.forge.title;
  }

  return slot.kind === "boost" ? content.boosts.names[slot.id] : itemName(content.economy, slot.id);
};

// How a slot of the bar stands in the run now: its boost on (and the share of it still to run), or cooling down
// (the whole seconds and share left), and whether there is anything left to use.
export interface SlotState {
  isOn: boolean;
  left: number;
  cooldown: { seconds: number; share: number } | null;
  isSpent: boolean;
  // What is left to use now: a weapon's shots as the run counts them, else the bar's own count.
  count: number;
}

export const slotState = (row: BarRow, boosts: VoyageSnapshot["boosts"] | null, weapons: VoyageSnapshot["weapons"] | null = null): SlotState => {
  if (row.slot?.kind === "weapon") {
    const count = weapons?.shots[row.slot.id] ?? row.count;

    return { isOn: false, left: 0, cooldown: weapons?.ready[row.slot.id] ?? null, isSpent: count <= 0, count };
  }

  const id = row.slot?.kind === "boost" ? row.slot.id : null;
  const on = id && boosts ? boosts.active.find((active) => active.id === id) : undefined;

  return {
    isOn: on !== undefined,
    left: on?.left ?? 0,
    cooldown: (id && boosts?.cooldowns[id]) || null,
    isSpent: row.slot !== null && row.count <= 0,
    count: row.count,
  };
};

// What a screen reader hears for a slot: its key, what it holds, its level and what is left, and whether it is on
// or cooling down; or that it is empty and where to fill it.
export const slotLabel = (content: FinaleVoyage, row: BarRow, index: number, state: SlotState): string => {
  const copy = content.boosts.bar;
  const n = index + 1;

  if (!row.slot) {
    return fill(copy.empty, { n });
  }

  const name = slotName(content, row.slot, row.base);
  const parts = [
    `${fill(copy.slot, { n })}: ${name}`,
    row.slot.kind !== "item" ? fill(copy.level, { level: row.level }) : "",
    fill(copy.left, { count: state.count }),
    state.isOn ? fill(copy.on, { name }) : "",
    state.cooldown ? fill(copy.cooling, { seconds: state.cooldown.seconds }) : "",
  ];

  return parts.filter(Boolean).join(", ");
};

// What to say when a boost's core is picked up, or a slot is pressed for nothing. Null for anything else.
export const boostNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const copy = content.boosts;

  switch (notice.kind) {
    case "boostFound": {
      const name = copy.names[notice.boost];

      if (notice.isFirst) {
        return fill(copy.firstFound, { name });
      }

      return notice.isLevelUp ? fill(copy.levelUp, { name, level: notice.level }) : fill(copy.found, { name, count: notice.charges });
    }
    case "slotRefused":
      return fill(copy.bar.refused[notice.reason], { name: slotName(content, notice.slot, notice.base ?? null), seconds: Math.ceil(notice.seconds) });
    default:
      return null;
  }
};

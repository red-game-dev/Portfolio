import type { HullTier, ItemStack, Purse, Suggestion, VoyageNotice } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage, VoyageEconomyCopy } from "@/types/game";

const TIER_ORDER: readonly HullTier[] = ["rocket", "shuttle", "corvette", "starship", "intergalactic"];
const CURRENCIES: ReadonlyArray<keyof Purse> = ["RED", "VOID"];
const MARKS_PER_HULL = 5;

// A ship's name from its hull and mark: "Corvette Mk III".
export const shipName = (copy: VoyageEconomyCopy, tier: HullTier, mark: number): string => fill(copy.shipName, {
  tier: copy.tiers[tier],
  mark: copy.marks[mark - 1] ?? String(mark),
});

// The same from a level, 0 to 24.
export const shipAtLevel = (copy: VoyageEconomyCopy, level: number): string => shipName(
  copy,
  TIER_ORDER[Math.min(TIER_ORDER.length - 1, Math.floor(level / MARKS_PER_HULL))],
  (level % MARKS_PER_HULL) + 1,
);

export const itemName = (copy: VoyageEconomyCopy, id: string): string => copy.items[id]?.name ?? id;

// Things counted: "2 Titanium, Scrap".
export const stacksText = (copy: VoyageEconomyCopy, stacks: readonly ItemStack[]): string => stacks
  .map(({ id, count }) => (count > 1 ? `${count} ${itemName(copy, id)}` : itemName(copy, id)))
  .join(", ");

const isTier = (value: string): value is HullTier => TIER_ORDER.some((tier) => tier === value);

// A blueprint's name: the thing a recipe makes, or a hull's plans.
export const blueprintName = (copy: VoyageEconomyCopy, id: string): string => {
  const [kind, subject = ""] = id.split(":");

  if (kind === "hull" && isTier(subject)) {
    return fill(copy.hullPlan, { ship: copy.tiers[subject] });
  }

  return itemName(copy, subject);
};

// Money with its symbols, leaving out a currency that is nothing: "+250 RC, +3 VS".
export const formatPurse = (copy: VoyageEconomyCopy, purse: Purse, isSigned = false): string => {
  const parts = CURRENCIES.filter((code) => purse[code] !== 0)
    .map((code) => `${isSigned && purse[code] > 0 ? "+" : ""}${purse[code].toLocaleString("en-GB")} ${copy.symbols[code]}`);

  return parts.length > 0 ? parts.join(", ") : `0 ${copy.symbols.RED}`;
};

// A ledger entry's memo (a key such as "upgrade:7" or "landing:Mars") in words.
export const ledgerMemo = (content: FinaleVoyage, memo: string): string => {
  const copy = content.economy;
  const [kind, ...rest] = memo.split(":");
  const raw = rest.join(":");
  const template = copy.ledger.memos[kind] ?? copy.ledger.memos[memo];

  if (!template) {
    return memo;
  }

  const detail = (() => {
    switch (kind) {
      case "discovery":
      case "landing":
      case "rescue":
        return content.stops[raw] ?? raw;
      case "upgrade":
        return shipAtLevel(copy, Number(raw));
      case "universe":
        return String(Number(raw) + 1);
      case "craft":
      case "recycling":
        return itemName(copy, raw);
      default:
        return raw;
    }
  })();

  return fill(template, { detail });
};

// What the one click will do.
export const suggestionText = (copy: VoyageEconomyCopy, suggestion: Suggestion): string => {
  switch (suggestion.kind) {
    case "upgrade":
      return fill(copy.suggestion.upgrade, { ship: shipName(copy, suggestion.tier, suggestion.mark) });
    case "repair":
      return fill(copy.suggestion.repair, { fault: copy.faults.names[suggestion.faultKind].toLowerCase() });
    case "craft":
      return fill(suggestion.reason === "fault" ? copy.suggestion.craftFault : copy.suggestion.craftUpgrade, { item: itemName(copy, suggestion.recipe) });
    case "use":
      return copy.suggestion.use[suggestion.reason];
    default:
      return "";
  }
};

// What to say when the economy changes during a run: a wreck salvaged (and what was left for want of room, and
// any plans found), a fault and its fix, an upgrade, and the larger sums earned. Null for anything else.
export const economyNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const copy = content.economy;

  switch (notice.kind) {
    case "salvaged": {
      const wreck = copy.salvage.wrecks[notice.wreck];
      const lines = [
        notice.kept.length > 0 ? fill(copy.salvage.found, { items: stacksText(copy, notice.kept) }) : "",
        notice.lost.length > 0 ? fill(copy.salvage.holdFull, { items: stacksText(copy, notice.lost) }) : "",
        ...notice.blueprints.map((id) => fill(copy.salvage.blueprint, { name: blueprintName(copy, id) })),
      ].filter(Boolean);

      return lines.length > 0 ? lines.join(". ") : fill(copy.salvage.nothing, { wreck });
    }
    case "fault":
      return copy.faults.notices[notice.fault];
    case "fixed":
      return fill(copy.faults.fixed, { fault: copy.faults.names[notice.fault] });
    case "upgraded":
      return fill(copy.upgraded, { ship: shipName(copy, notice.tier, notice.mark) });
    case "earned":
      return notice.deed === "boss" || notice.deed === "universe" || notice.deed === "rescue"
        ? fill(copy.earned[notice.deed], { red: notice.amounts.RED, void: notice.amounts.VOID })
        : null;
    default:
      return null;
  }
};

import { itemName } from "@/components/Finale/Voyage/economy";
import type { AmmoStock, AmmoType, GearDrop, GearStat, GearStats, ProgressView, RunSummary, VoyageNotice } from "@/packages/games/voyage";
import type { EnhanceForm } from "@/packages/progression/enhancement";
import { fill, formatDuration, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// The stats in the order the sheet lists them.
const STAT_ORDER: readonly GearStat[] = [
  "hull", "shields", "regen", "damage", "rate", "range", "crit", "resist", "thrust", "speed", "turn", "fuel", "economy", "plating", "pressure", "heat", "sensors",
  "magnet",
];

const AMMO_ORDER: readonly AmmoType[] = ["rounds", "missiles", "mines", "slugs", "cells", "shells"];

// A piece's name from its kind ("armor:2" reads "Alloy Plating", "weapon:missile:1" "Titanium Missile pod").
export const pieceName = (content: FinaleVoyage, base: string): string => {
  const copy = content.gear;
  const [first, second, third] = base.split(":");
  const isWeapon = first === "weapon";
  const grade = copy.grades[Number(isWeapon ? third : second)] ?? "";
  const weapons: Record<string, { name: string } | undefined> = copy.weapons;
  const slots: Record<string, string | undefined> = copy.slots;
  const piece = isWeapon ? weapons[second]?.name ?? second : slots[first] ?? first;

  return fill(copy.pieceName, { grade, piece });
};

// How far a piece is enhanced: "+3 stars", or that it is not yet.
export const formText = (content: FinaleVoyage, form: EnhanceForm): string => {
  const tier = form.tier ? content.gear.tiers[form.tier] : undefined;

  return tier ? fill(content.gear.form, { count: form.count, tier: form.count === 1 ? tier.one : tier.many }) : content.gear.noForm;
};

// What a piece, or the whole ship's fittings, add: each stat with its share as a percentage, largest first.
export const statLines = (content: FinaleVoyage, stats: GearStats): Array<{ stat: GearStat; label: string; value: string }> => STAT_ORDER
  .filter((stat) => (stats[stat] ?? 0) > 0.0005)
  .map((stat) => ({ stat, label: content.gear.stats[stat], value: `+${formatNumber((stats[stat] ?? 0) * 100, 1)}%` }));

// Ammunition counted: "40 Rounds, 3 Missiles".
export const ammoText = (content: FinaleVoyage, ammo: Partial<AmmoStock>): string => AMMO_ORDER
  .filter((type) => (ammo[type] ?? 0) > 0)
  .map((type) => fill(content.gear.notices.foundAmmo, { count: ammo[type] ?? 0, ammo: content.gear.ammo[type] }))
  .join(", ");

const gearText = (content: FinaleVoyage, gear: readonly GearDrop[]): string => gear.map((drop) => pieceName(content, drop.base)).join(", ");

// Where stars were won: a universe ("u:3") or a daily voyage ("d:2026-10-11").
const placeOfStars = (content: FinaleVoyage, key: string): string => (key.startsWith("d:")
  ? content.progress.daily
  : fill(content.progress.universe, { index: Number(key.slice(2)) + 1 }));

// What to say when the armoury or the pilot's progress moves: gear and ammunition found, a cache or chest opened, a
// streak, a level, stars, an achievement, a cosmetic, an enhancement. Null for anything else.
export const gearNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const { gear, progress } = content;

  switch (notice.kind) {
    case "loot": {
      const found = [gearText(content, notice.gear), ammoText(content, notice.ammo)].filter(Boolean).join(", ");

      return found ? fill(gear.notices.found, { items: found }) : null;
    }
    case "opened": {
      const items = notice.kept.map(({ id, count }) => (count > 1 ? `${count} ${itemName(content.economy, id)}` : itemName(content.economy, id))).join(", ");
      const opened = notice.chest ? gear.notices.chest : gear.notices.cache;

      return items ? `${opened}: ${fill(gear.notices.found, { items })}` : opened;
    }
    case "streak":
      return fill(gear.notices.streak, { count: notice.count });
    case "levelUp":
      return fill(progress.levelUp, { level: notice.level });
    case "stars":
      return fill(progress.starsWon, { stars: notice.stars, place: placeOfStars(content, notice.key) });
    case "achievement":
      return fill(progress.achievement, { name: progress.achievements[notice.id]?.name ?? notice.id });
    case "cosmetic":
      return fill(progress.cosmetic, { name: progress.paints[notice.id] ?? progress.trails[notice.id] ?? notice.id });
    case "enhanced": {
      const name = pieceName(content, notice.base);
      const template = notice.outcome === "success" ? gear.enhance.success : notice.outcome === "fell" ? gear.enhance.fell : gear.enhance.kept;

      return fill(template, { name, form: formText(content, notice.form) });
    }
    default:
      return null;
  }
};

// The rows of the card at a run's end.
export const summaryRows = (content: FinaleVoyage, summary: RunSummary): Array<{ label: string; value: string }> => {
  const copy = content.progress.summary;

  return [
    { label: copy.time, value: formatDuration(summary.seconds) },
    { label: copy.score, value: formatNumber(summary.score) },
    { label: copy.places, value: String(summary.places) },
    { label: copy.landings, value: String(summary.landings) },
    { label: copy.kills, value: String(summary.kills) },
    { label: copy.streak, value: String(summary.bestStreak) },
    { label: copy.coin, value: formatNumber(summary.coin) },
    { label: copy.exp, value: formatNumber(summary.exp) },
    { label: copy.levels, value: summary.levels > 0 ? `+${summary.levels}` : "0" },
    { label: copy.universes, value: String(summary.universes) },
    { label: copy.stars, value: String(summary.stars) },
    { label: copy.gear, value: summary.gear.length > 0 ? gearText(content, summary.gear) : "0" },
    {
      label: copy.achievements,
      value: summary.achievements.length > 0 ? summary.achievements.map((id) => content.progress.achievements[id]?.name ?? id).join(", ") : "0",
    },
  ].filter((row) => row.value !== "0" || row.label === copy.score || row.label === copy.time);
};

// The pilot's level line: "Level 12", and how far into the next.
export const levelLine = (content: FinaleVoyage, progress: ProgressView): string => {
  const { standing } = progress;
  const level = fill(content.progress.level, { level: progress.level });

  return standing.isCapped ? `${level}, ${content.progress.capped}` : `${level}, ${fill(content.progress.exp, {
    into: formatNumber(Math.round(standing.into)),
    next: formatNumber(standing.toNext),
  })}`;
};

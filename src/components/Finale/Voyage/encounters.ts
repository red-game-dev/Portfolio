import { placeName } from "@/components/Finale/Voyage/names";
import type { PerkId, PortView, VoyageNotice } from "@/packages/games/voyage";
import { PERKS, WEAPON_SPECS } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// A perk's name and what it does.
export const perkName = (content: FinaleVoyage, id: PerkId): string => content.encounters.perks.names[id]?.name ?? id;

export const perkNote = (content: FinaleVoyage, id: PerkId): string => content.encounters.perks.names[id]?.note ?? "";

// How many times a run can take a perk.
export const perkMax = (id: PerkId): number => PERKS.find((perk) => perk.id === id)?.max ?? 1;

// The perks a run has taken, each once with how many times: "Hot barrels x2, Vampire".
export const perksLine = (content: FinaleVoyage, taken: readonly PerkId[]): string => {
  const counts = new Map<PerkId, number>();

  taken.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));

  return [...counts].map(([id, count]) => (count > 1 ? `${perkName(content, id)} x${count}` : perkName(content, id))).join(", ");
};

// A port's name: a station by the world it circles (a free port where nobody keeps it in a universe), a trader by its
// people.
export const portName = (content: FinaleVoyage, port: PortView): string => {
  const copy = content.encounters.station;

  if (port.kind === "trader") {
    return port.faction ? fill(copy.trader, { faction: port.faction }) : copy.traderAlone;
  }

  const world = placeName(content, port.anchor ?? "", port.anchorName);

  return fill(port.faction || !port.anchorName ? copy.station : copy.freePort, { world });
};

// What to say of an encounter: a call for help and what it was, a boss's great attack winding up, a gun run dry.
export const encounterNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  const copy = content.encounters;

  switch (notice.kind) {
    case "distress":
      return copy.distress[notice.stage];
    case "bossMove":
      return copy.bossMoves[notice.move];
    case "dry": {
      if (notice.weapon === "primary") {
        return notice.isSilent ? copy.dry.silent : copy.dry.backup;
      }

      const ammo = content.gear.ammo[WEAPON_SPECS[notice.weapon].ammo];

      return fill(copy.dry.weapon, { ammo: ammo.toLowerCase(), weapon: content.gear.weapons[notice.weapon]?.name ?? notice.weapon });
    }
    default:
      return null;
  }
};

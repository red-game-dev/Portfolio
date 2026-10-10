import { careerNotice } from "@/components/Finale/Voyage/career";
import { economyNotice } from "@/components/Finale/Voyage/economy";
import type { VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import { fill, formatNumber } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

const formatKm = (km: number) => formatNumber(km, km < 10 ? 1 : 0);

// A universe's name: its own, or the zone it is named for.
const universeName = (snapshot: VoyageSnapshot, universes: string[]) => snapshot.universeName ?? universes[snapshot.universe] ?? "";

// A place's name: the content's for the solar system, its own made up one in a universe.
// A place's name: ours from the content, a made one as the universe named it.
export const placeName = (content: FinaleVoyage, id: string, madeName?: string | null) => content.stops[id] ?? madeName ?? id;

// What the voyage says aloud as it changes: each stop passed, the black hole, being lost, and where the ship
// comes out. Null when nothing new happened.
export const voyageMessage = (content: FinaleVoyage, next: VoyageSnapshot, previous: VoyageSnapshot | null, universes: string[]): string | null => {
  if (next.status !== "flying") {
    return null;
  }

  const isNewRun = previous === null || previous.status !== "flying";

  if (!isNewRun && next.phase !== previous.phase) {
    if (next.phase === "singularity") {
      return content.singularity;
    }

    if (next.phase === "lost") {
      return content.lost;
    }

    if (next.phase === "universe") {
      return fill(next.universes === 1 ? content.arrived : content.jumped, { universe: universeName(next, universes) });
    }
  }

  if (next.passing && (isNewRun || next.passing !== previous.passing)) {
    return fill(content.passing, { stop: placeName(content, next.passing) });
  }

  return null;
};

// Where the ship is, for the top of the screen: the distance from the Sun on the way out, then the universe.
export const voyagePlace = (content: FinaleVoyage, snapshot: VoyageSnapshot, universes: string[]): string => {
  if (snapshot.phase === "lost") {
    return content.lost;
  }

  if (snapshot.phase === "universe") {
    return fill(content.universe, { count: snapshot.universes, name: universeName(snapshot, universes) });
  }

  return fill(content.distance, { au: formatNumber(snapshot.telemetry.au ?? 1, 1, true) });
};

// What to say when something happens that the snapshot does not show: each phase of a way down and how the
// touchdown went, a lift off, an emergency burn,
// the moment a black hole takes the ship, a solar flare and its storm, a system failing, the hull melting, and
// the economy's moments (a wreck salvaged, a fault, an upgrade, a big payout). The end of a run has its own card.
export const voyageNotice = (content: FinaleVoyage, notice: VoyageNotice): string | null => {
  switch (notice.kind) {
    case "captured":
      return content.captured;
    case "destroyed":
      return null;
    case "flare":
      return fill(notice.isHeading ? content.flareHeading : content.flare, { class: notice.flareClass });
    case "storm":
      return content.storm;
    case "failing":
      return fill(notice.isGone ? content.gone : content.failing, { system: content.systems.names[notice.module] ?? notice.module });
    case "melting":
      return fill(content.melting, { temperature: Math.round(notice.temperatureC) });
    case "impactAlert":
      return fill(content.impactAlert, { diameter: formatKm(notice.diameterKm), target: placeName(content, notice.target), seconds: Math.round(notice.seconds) });
    case "impact":
      return fill(content.impact[notice.outcome], { target: placeName(content, notice.target), crater: formatKm(notice.craterKm) });
    case "impactorBroken":
      return fill(content.impactorBroken, { target: placeName(content, notice.target) });
    case "deflected":
      return fill(content.deflected, { target: placeName(content, notice.target) });
    case "boss":
      return fill(notice.isFallen ? content.bossFalls : content.bossAppears, { name: notice.name });
    case "heard":
      return content.heard;
    case "wormhole":
      return content.wormhole;
    case "supernova":
      return notice.isBlown ? content.supernova : fill(content.supernovaWarning, { seconds: Math.round(notice.seconds) });
    case "burst":
      return notice.isFired ? content.burst : fill(content.burstWarning, { seconds: Math.round(notice.seconds) });
    case "recovered":
      return fill(content.recovered, { days: notice.days });
    case "landed":
      return notice.speed === null
        ? fill(content.landed, { body: placeName(content, notice.body) })
        : fill(content.descent.landedAt, { body: placeName(content, notice.body), speed: formatNumber(notice.speed, 1, true) });
    // The touchdown has its own word, landed or too hard, so only the phases before it are said.
    case "descent":
      return notice.phase === "down" ? null : content.descent.phases[notice.phase];
    case "hardLanding":
      return fill(content.descent.hard, { body: placeName(content, notice.body), speed: formatNumber(notice.speed, 1, true), safe: formatNumber(notice.safe) });
    case "tookOff":
    case "emergency":
      return fill(notice.kind === "tookOff" ? content.tookOff : content.emergency, { body: placeName(content, notice.body) });
    default:
      return economyNotice(content, notice) ?? careerNotice(content, notice);
  }
};

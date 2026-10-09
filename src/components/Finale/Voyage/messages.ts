import type { VoyageNotice, VoyageSnapshot } from "@/packages/games/voyage";
import { fill } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

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
      return fill(next.universes === 1 ? content.arrived : content.jumped, { universe: universes[next.universe] ?? "" });
    }
  }

  if (next.passing && (isNewRun || next.passing !== previous.passing)) {
    return fill(content.passing, { stop: content.stops[next.passing] ?? next.passing });
  }

  return null;
};

// Where the ship is, for the top of the screen: the distance from the Sun on the way out, then the universe.
export const voyagePlace = (content: FinaleVoyage, snapshot: VoyageSnapshot, universes: string[]): string => {
  if (snapshot.phase === "lost") {
    return content.lost;
  }

  if (snapshot.phase === "universe") {
    return fill(content.universe, { count: snapshot.universes, name: universes[snapshot.universe] ?? "" });
  }

  return fill(content.distance, { au: (snapshot.telemetry.au ?? 1).toFixed(1) });
};

// What to say when something happens that the snapshot does not show: a landing, a lift off, an emergency burn,
// the moment a black hole takes the ship, a solar flare and its storm, a system failing, the hull melting. The
// end of a run has its own card.
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
    default:
      return fill(notice.kind === "landed" ? content.landed : notice.kind === "tookOff" ? content.tookOff : content.emergency, {
        body: content.stops[notice.body] ?? notice.body,
      });
  }
};

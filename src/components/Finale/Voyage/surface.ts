import { placeName, strandedLine } from "@/components/Finale/Voyage/messages";
import type { VoyageSnapshot } from "@/packages/games/voyage";
import { fill, formatHours, formatLatLon } from "@/packages/text/format";
import { FinaleVoyage } from "@/types/game";

// The card's heading on a world: where the ship stands, or at home days later, the pad the new rocket stands on.
export const surfaceHeading = (content: FinaleVoyage, snapshot: VoyageSnapshot): string => {
  const { surface } = snapshot;

  if (!surface) {
    return "";
  }

  return surface.pad
    ? fill(content.surface.atPad, { pad: surface.pad })
    : fill(content.surface.title, { body: placeName(content, surface.body, surface.name ?? snapshot.landedOn) });
};

// What the card says about the spot: the ground, where it is and its local time; home, the crew being picked up,
// then how many days later the pad is and that the new rocket is ready.
export const surfaceLines = (content: FinaleVoyage, snapshot: VoyageSnapshot, pad: string | null): string[] => {
  const { surface, homecoming } = snapshot;
  const copy = content.surface;

  if (!surface) {
    return [];
  }

  const time = fill(copy.time, { time: formatHours(surface.hours) });

  if (surface.pad && homecoming) {
    return [fill(copy.daysLater, { days: homecoming.days }), formatLatLon(surface.latitude, surface.longitude), time, copy.ready];
  }

  const lines = [copy.biomes[surface.biome], formatLatLon(surface.latitude, surface.longitude), time];

  if (snapshot.people) {
    const isFriendly = snapshot.people.disposition === "peaceful" || snapshot.people.disposition === "neutral";

    lines.push(fill(copy.people, { faction: snapshot.people.name }), isFriendly ? copy.welcome : copy.hostile);
  }

  if (surface.isHome && homecoming?.stage === "recovery") {
    lines.push(homecoming.isSea ? copy.recoverySea : copy.recoveryLand);
  } else if (surface.isHome) {
    lines.push(pad ? fill(copy.readyAt, { pad }) : copy.ready);
  }

  return lines;
};

// What the pilot can do next: wait while the crew is picked up and a rocket readied, launch the new one, lift off,
// or, with no fuel to lift off, how long until a rescue or the end.
export const surfaceHint = (content: FinaleVoyage, snapshot: VoyageSnapshot, pad: string | null): string => {
  const { surface, homecoming } = snapshot;
  const copy = content.surface;
  const stranded = strandedLine(content, snapshot);

  if (stranded) {
    return stranded;
  }

  if (surface?.isHome && homecoming?.stage === "recovery") {
    return pad ? fill(copy.readyingAt, { pad }) : copy.readying;
  }

  return surface?.isHome ? copy.launch : copy.takeOff;
};

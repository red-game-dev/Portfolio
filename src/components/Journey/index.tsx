import { FC, useEffect } from "react";

import { useGameStateHook } from "@/components/Game/hooks/useGameStateHook";
import { Backdrop } from "@/components/Journey/Backdrop";
import useJourney from "@/components/Journey/hooks/useJourney";
import { Hud, HudContent } from "@/components/Journey/Hud";
import { JourneyProgress } from "@/components/Journey/JourneyProgress";
import { ZoneTrail } from "@/components/Journey/ZoneTrail";
import { useLensStateHook } from "@/components/Lens/hooks/useLensStateHook";
import { ZONE_BOUNDARIES } from "@/config/zones";
import { TrailSection } from "@/services/journey/trail";
import { JourneyTrailContent } from "@/types/game";

interface JourneyProps {
  isEnabled: boolean;
  hud: HudContent;
  trail: { sections: TrailSection[]; labels: JourneyTrailContent };
}

const MMO_INDEX = ZONE_BOUNDARIES.findIndex(({ zone }) => zone === "mmo");

// How far through the MMO zone the reader is, from where it starts to the bottom of the page.
const zoneProgress = (progress: number, start = 1) => Math.min(1, Math.max(0, (progress - start) / Math.max(0.0001, 1 - start)));

// The page as a journey through four zones. Crossing into one changes the world itself: the backdrop plays
// a transition into the next scene and the whole page takes on the zone's accent. No labels needed.
export const Journey: FC<JourneyProps> = ({ isEnabled, hud, trail }: JourneyProps) => {
  const { zone, zoneIndex, progress, starts } = useJourney(isEnabled);
  const { visitZone } = useGameStateHook();
  const { settings } = useLensStateHook();

  useEffect(() => {
    document.documentElement.dataset.zone = zone;
  }, [zone]);

  // Reaching a zone means passing every zone before it, even when a menu link jumped over them.
  useEffect(() => {
    ZONE_BOUNDARIES.slice(0, zoneIndex + 1).forEach((boundary) => visitZone(boundary.zone));
  }, [visitZone, zoneIndex]);

  return (
    <>
      <Backdrop zone={zone} isEnabled={isEnabled} isStill={settings.backdrop === "still"} transitions={settings.transitions} />
      <JourneyProgress progress={progress} starts={starts} zoneIndex={zoneIndex} />
      <ZoneTrail
        zone={zone}
        zoneIndex={zoneIndex}
        zoneCount={ZONE_BOUNDARIES.length}
        sections={trail.sections}
        labels={trail.labels}
        isEnabled={isEnabled}
      />
      <Hud {...hud} isVisible={settings.gameLayer && zone === "mmo"} experience={zoneProgress(progress, starts[MMO_INDEX])} />
    </>
  );
};

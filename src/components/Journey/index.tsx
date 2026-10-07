import { FC, useEffect, useMemo, useRef } from "react";

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

// The page as a journey through four zones. Crossing into one changes the world itself: the backdrop plays
// a transition into the next scene and the whole page takes on the zone's accent. No labels needed.
export const Journey: FC<JourneyProps> = ({ isEnabled, hud, trail }: JourneyProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const targets = useMemo(() => ({ progress: progressRef, experience: hudRef }), []);
  const { zone, zoneIndex, starts } = useJourney(isEnabled, targets);
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
      <Backdrop zone={zone} isEnabled={isEnabled} transitions={settings.transitions} />
      <JourneyProgress ref={progressRef} starts={starts} zoneIndex={zoneIndex} />
      <ZoneTrail
        zone={zone}
        zoneIndex={zoneIndex}
        zoneCount={ZONE_BOUNDARIES.length}
        sections={trail.sections}
        labels={trail.labels}
        isEnabled={isEnabled}
      />
      <Hud ref={hudRef} {...hud} isVisible={settings.gameLayer && zone === "mmo"} />
    </>
  );
};

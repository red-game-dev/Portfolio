import { FC, useEffect } from "react";

import { Backdrop } from "@/components/Journey/Backdrop";
import useJourney from "@/components/Journey/hooks/useJourney";
import { Hud, HudContent } from "@/components/Journey/Hud";
import { JourneyProgress } from "@/components/Journey/JourneyProgress";
import { ZONE_BOUNDARIES } from "@/config/zones";

interface JourneyProps {
  isEnabled: boolean;
  hud: HudContent;
}

const MMO_INDEX = ZONE_BOUNDARIES.findIndex(({ zone }) => zone === "mmo");

// How far through the MMO zone the reader is, from where it starts to the bottom of the page.
const zoneProgress = (progress: number, start = 1) => Math.min(1, Math.max(0, (progress - start) / Math.max(0.0001, 1 - start)));

// The page as a journey through four zones. Crossing into one changes the world itself: the backdrop plays
// a transition into the next scene and the whole page takes on the zone's accent. No labels needed.
export const Journey: FC<JourneyProps> = ({ isEnabled, hud }: JourneyProps) => {
  const { zone, zoneIndex, progress, starts } = useJourney(isEnabled);

  useEffect(() => {
    document.documentElement.dataset.zone = zone;
  }, [zone]);

  return (
    <>
      <Backdrop zone={zone} isEnabled={isEnabled} />
      <JourneyProgress progress={progress} starts={starts} zoneIndex={zoneIndex} />
      <Hud {...hud} isVisible={zone === "mmo"} experience={zoneProgress(progress, starts[MMO_INDEX])} />
    </>
  );
};

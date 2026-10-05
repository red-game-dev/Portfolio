import { FC, useEffect } from "react";

import { Backdrop } from "@/components/Journey/Backdrop";
import useJourney from "@/components/Journey/hooks/useJourney";
import { JourneyProgress } from "@/components/Journey/JourneyProgress";

interface JourneyProps {
  isEnabled: boolean;
}

// The page as a journey through four zones. Crossing into one changes the world itself: the backdrop plays
// a transition into the next scene and the whole page takes on the zone's accent. No labels needed.
export const Journey: FC<JourneyProps> = ({ isEnabled }: JourneyProps) => {
  const { zone, zoneIndex, progress, starts } = useJourney(isEnabled);

  useEffect(() => {
    document.documentElement.dataset.zone = zone;
  }, [zone]);

  return (
    <>
      <Backdrop zone={zone} isEnabled={isEnabled} />
      <JourneyProgress progress={progress} starts={starts} zoneIndex={zoneIndex} />
    </>
  );
};

import { FC } from "react";

import { Backdrop } from "@/components/Journey/Backdrop";
import useJourney from "@/components/Journey/hooks/useJourney";
import { JourneyProgress } from "@/components/Journey/JourneyProgress";
import { ZoneBanner } from "@/components/Journey/ZoneBanner";
import { Journey as JourneyContent } from "@/types/journey";

interface JourneyProps extends JourneyContent {
  isEnabled: boolean;
}

// The page as a journey through four zones: a backdrop that changes scene, a banner when a zone begins,
// and a progress bar. All of it is decoration over the content and hidden from assistive tech.
export const Journey: FC<JourneyProps> = ({ isEnabled, zoneLabel, zones }: JourneyProps) => {
  const { zone, zoneIndex, progress, starts } = useJourney(isEnabled);

  return (
    <>
      <Backdrop zone={zone} isEnabled={isEnabled} />
      <JourneyProgress progress={progress} starts={starts} zoneIndex={zoneIndex} />
      <ZoneBanner zone={zone} zoneIndex={zoneIndex} zoneLabel={zoneLabel} zones={zones} />
    </>
  );
};

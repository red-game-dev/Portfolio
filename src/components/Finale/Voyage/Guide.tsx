import { FC } from "react";

import { GuideActions, GuideCard, GuideStep, GuideText } from "@/components/Finale/Voyage/VoyageDialog.styles";
import { FinaleVoyage } from "@/types/game";

interface GuideProps {
  content: FinaleVoyage;
  step: number;
  isTouch: boolean;
  onNext: () => void;
  onSkip: () => void;
}

// One step of the guided first flight: what to try now, which step of how many, and moving on or skipping it all.
// Each step also moves on by itself once the pilot has done what it asks.
export const Guide: FC<GuideProps> = ({ content, step, isTouch, onNext, onSkip }) => {
  const copy = content.progress.guide;
  const steps = isTouch ? copy.touchSteps : copy.steps;
  const isLast = step >= steps.length - 1;

  return (
    <GuideCard role="status" aria-label={copy.title}>
      <GuideStep>{`${copy.title}, ${step + 1} / ${steps.length}`}</GuideStep>
      <GuideText>{steps[Math.min(step, steps.length - 1)]}</GuideText>
      <GuideActions>
        <button type="button" onClick={onNext}>{isLast ? copy.done : copy.next}</button>
        {!isLast && <button type="button" onClick={onSkip}>{copy.skip}</button>}
      </GuideActions>
    </GuideCard>
  );
};

import { useEffect, useState } from "react";

import { prefersReducedMotion } from "@/packages/accessibility/motion";

// One clock for a whole group of animated items: 0 when inactive, rising to 1 over `duration` once active.
// Going inactive resets it, so the animation plays again the next time.
// A single re-render per frame for the group, instead of one per item.
export default function useAnimationProgress(isActive: boolean, duration: number) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);

      return;
    }

    if (prefersReducedMotion()) {
      setProgress(1);

      return;
    }

    let frameId = 0;
    let startedAt: number | null = null;

    const step = (time: number) => {
      startedAt = startedAt ?? time;

      const next = Math.min(1, (time - startedAt) / duration);

      setProgress(next);

      if (next < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [duration, isActive]);

  return progress;
}

import { RefObject, useEffect, useState } from "react";

import { TrailSection } from "@/services/journey/trail";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Which section the middle of the screen is in, and how far through it. The progress goes straight into
// --trail-progress on the given elements, so following the scroll costs no React render; only moving into
// a new section changes state.
export default function useTrail(sections: TrailSection[], targets: Array<RefObject<HTMLElement>>, isEnabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let frameId = 0;

    const measure = () => {
      const middle = window.innerHeight / 2;
      const rects = sections.map(({ id }) => document.getElementById(id)?.getBoundingClientRect() ?? null);
      const current = rects.reduce<number>((found, rect, position) => (rect && rect.top <= middle ? position : found), 0);
      const rect = rects[current];
      const progress = rect ? clamp01((middle - rect.top) / Math.max(1, rect.height)) : 0;

      targets.forEach((target) => target.current?.style.setProperty("--trail-progress", progress.toFixed(4)));
      setIndex(current);
    };
    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isEnabled, sections, targets]);

  return index;
}

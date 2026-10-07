import { RefObject, useState } from "react";

import useScrollFrame from "@/hooks/useScrollFrame";
import { clamp01 } from "@/packages/math/clamp";
import { TrailSection } from "@/services/journey/trail";

// Which section the middle of the screen is in, and how far through it. The progress goes straight into
// --trail-progress on the given elements, so following the scroll costs no React render; only moving into
// a new section changes state.
export default function useTrail(sections: TrailSection[], targets: Array<RefObject<HTMLElement>>, isEnabled: boolean) {
  const [index, setIndex] = useState(0);

  useScrollFrame(() => ({
    read: ({ rectOf, viewportHeight }) => {
      const middle = viewportHeight / 2;
      const rects = sections.map(({ id }) => rectOf(id));
      const current = rects.reduce<number>((found, rect, position) => (rect && rect.top <= middle ? position : found), 0);
      const rect = rects[current];

      return { current, progress: rect ? clamp01((middle - rect.top) / Math.max(1, rect.height)) : 0 };
    },
    write: ({ current, progress }) => {
      targets.forEach((target) => target.current?.style.setProperty("--trail-progress", progress.toFixed(4)));
      setIndex(current);
    },
  }), [sections, targets], isEnabled);

  return index;
}

import { MutableRefObject, useEffect } from "react";

export interface NavGroup {
  // The first and last section the item covers, in page order.
  first: string;
  last: string;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// How far the middle of the screen is through each item's run of sections, written into --nav-progress on
// the item itself: 0 before the run, 1 once past it. Once per frame, with no React render.
export default function useNavProgress(groups: NavGroup[], items: MutableRefObject<Array<HTMLElement | null>>) {
  useEffect(() => {
    let frameId = 0;

    const measure = () => {
      const middle = window.innerHeight / 2;

      groups.forEach(({ first, last }, index) => {
        const start = document.getElementById(first)?.getBoundingClientRect();
        const end = document.getElementById(last)?.getBoundingClientRect();
        const item = items.current[index];

        if (!start || !end || !item) {
          return;
        }

        item.style.setProperty("--nav-progress", clamp01((middle - start.top) / Math.max(1, end.bottom - start.top)).toFixed(4));
      });
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
  }, [groups, items]);
}

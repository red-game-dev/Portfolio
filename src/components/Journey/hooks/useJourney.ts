import { useEffect, useState } from "react";

import { ZONE_BOUNDARIES, ZoneId } from "@/config/zones";

export interface JourneyState {
  zone: ZoneId;
  zoneIndex: number;
  // 0 at the top of the page, 1 at the bottom.
  progress: number;
  // Where each zone starts along the page, 0 to 1, for the progress bar ticks.
  starts: number[];
}

const INITIAL_STATE: JourneyState = { zone: ZONE_BOUNDARIES[0].zone, zoneIndex: 0, progress: 0, starts: [] };

const measure = (): JourneyState => {
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const middle = window.innerHeight / 2;
  const tops = ZONE_BOUNDARIES.map(({ startsAt }) => document.getElementById(startsAt)?.getBoundingClientRect().top ?? null);
  const zoneIndex = tops.reduce<number>((current, top, index) => (top !== null && top <= middle ? index : current), 0);

  return {
    zone: ZONE_BOUNDARIES[zoneIndex].zone,
    zoneIndex,
    progress: Math.min(1, Math.max(0, window.scrollY / scrollable)),
    starts: tops.map((top) => (top === null ? 0 : Math.min(1, Math.max(0, (top + window.scrollY) / scrollable)))),
  };
};

// Which zone the reader is in and how far down the page they are. Measured at most once per frame, from a
// passive scroll listener, and again whenever the page changes height.
export default function useJourney(isEnabled: boolean) {
  const [state, setState] = useState<JourneyState>(INITIAL_STATE);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let frameId = 0;

    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setState(measure()));
    };
    const resizeObserver = new ResizeObserver(schedule);

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    resizeObserver.observe(document.body);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver.disconnect();
    };
  }, [isEnabled]);

  return state;
}

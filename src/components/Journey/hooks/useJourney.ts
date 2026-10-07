import { RefObject, useState } from "react";

import { ZONE_BOUNDARIES, ZoneId } from "@/config/zones";
import useScrollFrame from "@/hooks/useScrollFrame";
import { FrameReading } from "@/packages/interaction/scroll-frame";
import { clamp01 } from "@/packages/math/clamp";

export interface JourneyState {
  zone: ZoneId;
  zoneIndex: number;
  // Where each zone starts along the page, 0 to 1, for the progress bar ticks.
  starts: number[];
}

interface JourneyReading extends JourneyState {
  // 0 at the top of the page, 1 at the bottom.
  progress: number;
}

interface JourneyTargets {
  // Gets --journey-progress: how far down the page the reader is.
  progress: RefObject<HTMLElement>;
  // Gets --journey-experience: how far through the last zone, for the HUD's experience bar.
  experience: RefObject<HTMLElement>;
}

const INITIAL_STATE: JourneyState = { zone: ZONE_BOUNDARIES[0].zone, zoneIndex: 0, starts: [] };
const LAST_ZONE = ZONE_BOUNDARIES.length - 1;

export const readJourney = ({ rectOf, viewportHeight, scrollY, scrollHeight }: FrameReading): JourneyReading => {
  const scrollable = Math.max(1, scrollHeight - viewportHeight);
  const middle = viewportHeight / 2;
  const tops = ZONE_BOUNDARIES.map(({ startsAt }) => rectOf(startsAt)?.top ?? null);
  const zoneIndex = tops.reduce<number>((current, top, index) => (top !== null && top <= middle ? index : current), 0);

  return {
    zone: ZONE_BOUNDARIES[zoneIndex].zone,
    zoneIndex,
    progress: clamp01(scrollY / scrollable),
    starts: tops.map((top) => (top === null ? 0 : clamp01((top + scrollY) / scrollable))),
  };
};

// Zone starts move by fractions of a pixel as images load; a tick only needs to move when it visibly would.
const sameStarts = (first: number[], second: number[]) => first.length === second.length
  && first.every((value, index) => Math.abs(value - second[index]) < 0.001);

// Which zone the reader is in and how far down the page they are, on the shared scroll frame. The zone and
// the tick positions are state and change rarely; the progress follows every frame through CSS variables
// on the elements that draw it, so scrolling re-renders nothing.
export default function useJourney(isEnabled: boolean, targets: JourneyTargets) {
  const [state, setState] = useState<JourneyState>(INITIAL_STATE);

  useScrollFrame(() => ({
    read: readJourney,
    write: ({ progress, ...next }) => {
      const lastStart = next.starts[LAST_ZONE] ?? 1;

      targets.progress.current?.style.setProperty("--journey-progress", progress.toFixed(4));
      targets.experience.current?.style.setProperty("--journey-experience", clamp01((progress - lastStart) / Math.max(0.0001, 1 - lastStart)).toFixed(4));
      setState((previous) => (previous.zoneIndex === next.zoneIndex && sameStarts(previous.starts, next.starts) ? previous : next));
    },
  }), [targets.experience, targets.progress], isEnabled);

  return state;
}

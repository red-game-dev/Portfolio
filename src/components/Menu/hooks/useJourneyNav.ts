import { RefObject, useState } from "react";

import { NavItem } from "@/components/Menu/config";
import { journeyState, sameSelection, StopSpan } from "@/components/Menu/utils/journeyState";
import useScrollFrame from "@/hooks/useScrollFrame";
import { FrameReading } from "@/packages/interaction/scroll-frame";

// The first of the ids that is in the page: a stop can start at a section only some views render.
const spanOf = ({ first, last }: NavItem, { rectOf }: FrameReading): StopSpan | null => {
  const start = (Array.isArray(first) ? first : [first]).map(rectOf).find(Boolean) ?? null;
  const end = rectOf(last);

  return start && end ? { top: start.top, bottom: end.bottom } : null;
};

// The journey's scroll spy, for every menu at once, on the shared scroll frame. Which stops are on screen
// comes back as state, and only changes when a stop enters or leaves; how far through each stop the reader
// is goes into --nav-progress-<index> on `targetRef` (the header, which holds both menus), with no
// re-render and without restyling the rest of the page.
export default function useJourneyNav(items: NavItem[], targetRef: RefObject<HTMLElement>) {
  const [selected, setSelected] = useState<boolean[]>(() => items.map(() => false));

  useScrollFrame(() => ({
    read: (reading) => journeyState(items.map((item) => spanOf(item, reading)), reading.viewportHeight),
    write: (state) => {
      state.progress.forEach((value, index) => targetRef.current?.style.setProperty(`--nav-progress-${index}`, value.toFixed(4)));
      setSelected((previous) => (sameSelection(previous, state.selected) ? previous : state.selected));
    },
  }), [items, targetRef]);

  return selected;
}

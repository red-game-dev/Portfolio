import { clamp01 } from "@/packages/math/clamp";

// Where a stop of the journey sits relative to the screen, from the top of its first section to the
// bottom of its last, in viewport pixels. Null when its sections are not in the page.
export interface StopSpan {
  top: number;
  bottom: number;
}

export interface JourneyState {
  // Whether any part of the stop is on screen.
  selected: boolean[];
  // How far the middle of the screen is through the stop: 0 before it, 1 once past it.
  progress: number[];
}

export const journeyState = (spans: Array<StopSpan | null>, viewportHeight: number): JourneyState => ({
  selected: spans.map((span) => span !== null && span.top < viewportHeight && span.bottom > 0),
  progress: spans.map((span) => (span === null ? 0 : clamp01((viewportHeight / 2 - span.top) / Math.max(1, span.bottom - span.top)))),
});

export const sameSelection = (first: boolean[], second: boolean[]) => first.length === second.length && first.every((value, index) => value === second[index]);

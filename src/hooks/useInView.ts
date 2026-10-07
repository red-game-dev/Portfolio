import { RefObject, useEffect, useState } from "react";

interface InViewOptions {
  threshold?: number;
  // Left out: a reveal that replays. It turns on once `threshold` of the element is on screen and off
  // only when the element has left the screen entirely, so scrolling back to it plays it again, and it
  // never runs backwards while still partly visible.
  // true: turn on once and stay on, for work that only needs doing once, such as building a drawing.
  // false: follow the element in and out exactly, for loops that should pause while off screen.
  once?: boolean;
  // Grows the viewport, so something can start before it is actually on screen.
  rootMargin?: string;
}

export type InViewMode = "replay" | "once" | "follow";

export const inViewModeOf = (once: boolean | undefined): InViewMode => {
  if (once === undefined) {
    return "replay";
  }

  return once ? "once" : "follow";
};

// Whether the element counts as in view after an observation, given whether it did before. Past the
// threshold always counts; a replay stays on while any of it is still on screen; once stays on for good.
export const nextInView = (mode: InViewMode, entry: Pick<IntersectionObserverEntry, "isIntersecting" | "intersectionRatio">, threshold: number, wasInView: boolean) => {
  const isPast = entry.isIntersecting && entry.intersectionRatio >= threshold;

  switch (mode) {
    case "once":
      return wasInView || isPast;
    case "follow":
      return isPast;
    default:
      return isPast || (wasInView && entry.isIntersecting);
  }
};

// IntersectionObserver based, so it costs nothing while scrolling.
export default function useInView<TElement extends Element>(ref: RefObject<TElement>, { threshold = 0.25, once, rootMargin = "0px" }: InViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);

      return;
    }

    const mode = inViewModeOf(once);
    let wasInView = false;
    // A replay also hears about the element leaving entirely, not only about it crossing the threshold.
    const observer = new IntersectionObserver(([entry]) => {
      wasInView = nextInView(mode, entry, threshold, wasInView);
      setIsInView(wasInView);

      if (mode === "once" && wasInView) {
        observer.disconnect();
      }
    }, { threshold: mode === "replay" ? [0, threshold] : threshold, rootMargin });

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, ref, rootMargin, threshold]);

  return isInView;
}

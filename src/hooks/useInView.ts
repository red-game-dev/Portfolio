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

    const isReplay = once === undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (isReplay) {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setIsInView(true);
        } else if (!entry.isIntersecting) {
          setIsInView(false);
        }

        return;
      }

      if (!once) {
        setIsInView(entry.isIntersecting);

        return;
      }

      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: isReplay ? [0, threshold] : threshold, rootMargin });

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, ref, rootMargin, threshold]);

  return isInView;
}

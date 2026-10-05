import { RefObject, useEffect, useRef } from "react";

interface DoneOptions {
  // Progress at which the element counts as done.
  at: number;
  // Once done, stay done when the reader scrolls back up.
  isSticky?: boolean;
  // Called each time the done state flips, never once per frame.
  onChange?: (isDone: boolean) => void;
}

// Writes how far the reader has scrolled through an element (0 to 1) into a CSS custom property on it,
// so a line or fill can follow the scroll with a transform and no React re-render per frame. It only
// listens while the element is near the screen.
// `done`, when given, also sets data-done on the element once the progress reaches it, for styles that
// should switch rather than follow, such as a boss being defeated.
export default function useScrollProgressVar<TElement extends HTMLElement>(
  ref: RefObject<TElement>,
  property = "--scroll-progress",
  anchor = 0.65,
  done?: DoneOptions
) {
  const doneAt = done?.at;
  const isSticky = done?.isSticky ?? false;
  // Kept in a ref so a new callback each render does not tear the listeners down.
  const onDoneChangeRef = useRef(done?.onChange);

  onDoneChangeRef.current = done?.onChange;

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    let frameId = 0;
    let isDone = false;

    const update = () => {
      const rect = element.getBoundingClientRect();
      const progress = (window.innerHeight * anchor - rect.top) / Math.max(1, rect.height);
      const clamped = Math.min(1, Math.max(0, progress));

      element.style.setProperty(property, String(clamped));

      if (doneAt === undefined || clamped >= doneAt === isDone || (isDone && isSticky)) {
        return;
      }

      isDone = clamped >= doneAt;
      element.dataset.done = String(isDone);
      onDoneChangeRef.current?.(isDone);
    };
    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", schedule, { passive: true });
      } else {
        window.removeEventListener("scroll", schedule);
      }

      schedule();
    });

    observer.observe(element);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, [anchor, doneAt, isSticky, property, ref]);
}

import { RefObject, useEffect, useRef } from "react";

import { getScrollFrame } from "@/hooks/useScrollFrame";
import { clamp01 } from "@/packages/math/clamp";

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

    let isDone = false;
    let unsubscribe: (() => void) | null = null;

    const task = {
      read: ({ viewportHeight }: { viewportHeight: number }) => {
        const rect = element.getBoundingClientRect();

        return clamp01((viewportHeight * anchor - rect.top) / Math.max(1, rect.height));
      },
      write: (progress: number) => {
        element.style.setProperty(property, String(progress));

        if (doneAt === undefined || progress >= doneAt === isDone || (isDone && isSticky)) {
          return;
        }

        isDone = progress >= doneAt;
        element.dataset.done = String(isDone);
        onDoneChangeRef.current?.(isDone);
      },
    };
    // Only on the shared scroll frame while the element is near the screen.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !unsubscribe) {
        unsubscribe = getScrollFrame().subscribe(task);
      } else if (!entry.isIntersecting && unsubscribe) {
        // One last measure on the way out, so the element settles at 0 or 1 rather than wherever the last
        // frame left it. Observer callbacks run after layout, so this read is free.
        task.write(task.read({ viewportHeight: window.innerHeight }));
        unsubscribe();
        unsubscribe = null;
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      unsubscribe?.();
    };
  }, [anchor, doneAt, isSticky, property, ref]);
}

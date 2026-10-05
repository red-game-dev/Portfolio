import { RefObject, useEffect } from "react";

// Writes how far the reader has scrolled through an element (0 to 1) into a CSS custom property on it,
// so a line or fill can follow the scroll with a transform and no React re-render per frame. It only
// listens while the element is near the screen.
export default function useScrollProgressVar<TElement extends HTMLElement>(ref: RefObject<TElement>, property = "--scroll-progress", anchor = 0.65) {
  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    let frameId = 0;

    const update = () => {
      const rect = element.getBoundingClientRect();
      const progress = (window.innerHeight * anchor - rect.top) / Math.max(1, rect.height);

      element.style.setProperty(property, String(Math.min(1, Math.max(0, progress))));
    };
    const schedule = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", schedule, { passive: true });
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
        schedule();
      }
    });

    observer.observe(element);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, [anchor, property, ref]);
}

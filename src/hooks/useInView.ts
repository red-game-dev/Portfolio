import { RefObject, useEffect, useState } from "react";

interface InViewOptions {
  threshold?: number;
  // true: flip to true once and stay there, for reveals that should play a single time.
  // false: follow the element in and out, for loops that should pause while off screen.
  once?: boolean;
}

// IntersectionObserver based, so it costs nothing while scrolling. useCollision is the scroll event
// version the Menu scroll-spy uses.
export default function useInView<TElement extends Element>(ref: RefObject<TElement>, { threshold = 0.25, once = true }: InViewOptions = {}) {
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

    const observer = new IntersectionObserver(([entry]) => {
      if (!once) {
        setIsInView(entry.isIntersecting);

        return;
      }

      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, ref, threshold]);

  return isInView;
}

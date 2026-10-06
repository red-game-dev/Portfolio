import { RefObject, useEffect, useState } from "react";

// The element's own width, kept current by a ResizeObserver. 0 until it has been measured.
export default function useWidth<TElement extends HTMLElement>(ref: RefObject<TElement>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

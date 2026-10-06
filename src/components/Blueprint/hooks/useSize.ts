import { RefObject, useEffect, useState } from "react";

// The element's layout size, kept current by a ResizeObserver. Transforms do not change it, so a diagram
// scaled down to fit still reports the size it is laid out at. 0 by 0 until it has been measured.
export default function useSize<TElement extends HTMLElement>(ref: RefObject<TElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

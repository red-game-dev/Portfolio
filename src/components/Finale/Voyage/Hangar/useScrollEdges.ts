import { RefObject, useEffect, useState } from "react";

// Whether a row that scrolls sideways has more past its start and past its end, followed as it scrolls and as it
// changes size, so its edges fade only where there is something to scroll to.
export const useScrollEdges = (ref: RefObject<HTMLElement>) => {
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const row = ref.current;

    if (!row) {
      return undefined;
    }

    const measure = () => {
      const start = row.scrollLeft > 1;
      const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;

      setEdges((now) => (now.start === start && now.end === end ? now : { start, end }));
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);

    measure();
    row.addEventListener("scroll", measure, { passive: true });
    observer?.observe(row);

    return () => {
      row.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [ref]);

  return edges;
};

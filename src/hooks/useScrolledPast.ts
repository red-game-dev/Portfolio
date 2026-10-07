import { useState } from "react";

import useScrollFrame from "@/hooks/useScrollFrame";

// True once the page has scrolled further than `share` of the viewport height. Read on the shared scroll
// frame, and only re-renders when the answer flips.
export default function useScrolledPast(share: number) {
  const [isPast, setIsPast] = useState(false);

  useScrollFrame(() => ({
    read: ({ scrollY, viewportHeight }) => scrollY > viewportHeight * share,
    write: setIsPast,
  }), [share]);

  return isPast;
}

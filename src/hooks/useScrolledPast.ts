import { useEffect, useState } from "react";

// True once the page has scrolled further than `share` of the viewport height. Reads at most once a frame
// and only re-renders when the answer flips.
export default function useScrolledPast(share: number) {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIsPast(window.scrollY > window.innerHeight * share));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [share]);

  return isPast;
}

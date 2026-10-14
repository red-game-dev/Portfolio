import { useEffect, useState } from "react";

// Short of whole by less than this share, an alert counts as having its room (rounding at the room's edge).
const WHOLE = 0.99;

// How many of the alerts in a list have no whole room in it, watched as they come and go and as their room changes,
// each one marked data-folded so it hides and a line can stand for them; `reserve` px at the top are kept for that
// line. Nothing folds while they are opened to be scrolled through, or while there is no list.
export const useFoldedAlerts = (list: HTMLElement | null, reserve: number, isExpanded: boolean): number => {
  const [folded, setFolded] = useState(0);

  useEffect(() => {
    if (!list) {
      setFolded(0);

      return undefined;
    }

    const alerts = () => [...list.children].filter((child) => !child.hasAttribute("data-alerts-more"));

    if (isExpanded || typeof IntersectionObserver === "undefined") {
      alerts().forEach((alert) => alert.removeAttribute("data-folded"));
      setFolded(0);

      return undefined;
    }

    const shares = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        shares.set(entry.target, entry.intersectionRatio);
        entry.target.toggleAttribute("data-folded", entry.intersectionRatio < WHOLE);
      });
      setFolded([...shares.values()].filter((share) => share < WHOLE).length);
    }, { root: list, rootMargin: `-${reserve}px 0px 0px 0px`, threshold: [0, WHOLE, 1] });
    // Every alert there now, watched afresh whenever one comes or goes.
    const watch = () => {
      observer.disconnect();
      shares.clear();
      alerts().forEach((alert) => observer.observe(alert));
    };
    const changes = new MutationObserver(watch);

    watch();
    changes.observe(list, { childList: true });

    return () => {
      observer.disconnect();
      changes.disconnect();
    };
  }, [list, reserve, isExpanded]);

  return folded;
};

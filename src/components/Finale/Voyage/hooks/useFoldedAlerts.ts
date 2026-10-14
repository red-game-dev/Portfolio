import { useEffect, useState } from "react";

// Room an alert may be short of the top by and still count as whole, for rounding (px).
const SLACK = 0.5;

// How many of the alerts in a list have no whole room in it, each marked data-folded so it hides and a line can stand
// for them. The alerts stack up from the list's bottom, so it is those at the top that run out of room; once any does,
// `reserve` px at the top are kept for the line too. Read afresh whenever the list or an alert changes size, or one
// comes or goes; folding only hides an alert, so it never moves the others. Opened to be scrolled through, nothing is
// folded and the last count is kept, so the line standing for them stays put while it says how to close them.
export const useFoldedAlerts = (list: HTMLElement | null, reserve: number, isExpanded: boolean): number => {
  const [folded, setFolded] = useState(0);

  useEffect(() => {
    if (!list) {
      setFolded(0);

      return undefined;
    }

    const alerts = () => [...list.children].filter((child) => !child.hasAttribute("data-alerts-more"));

    if (isExpanded) {
      alerts().forEach((alert) => alert.removeAttribute("data-folded"));

      return undefined;
    }

    const refold = () => {
      const top = list.getBoundingClientRect().top;
      const shown = alerts();
      const isCut = shown.some((alert) => alert.getBoundingClientRect().top < top - SLACK);
      const limit = top + (isCut ? reserve : 0) - SLACK;
      let count = 0;

      shown.forEach((alert) => {
        const isFolded = alert.getBoundingClientRect().top < limit;

        alert.toggleAttribute("data-folded", isFolded);
        count += isFolded ? 1 : 0;
      });
      setFolded(count);
    };
    const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(refold);
    // Every alert there now watched for its size, afresh whenever one comes or goes.
    const watch = () => {
      sizes?.disconnect();
      sizes?.observe(list);
      alerts().forEach((alert) => sizes?.observe(alert));
      refold();
    };
    const changes = new MutationObserver(watch);

    watch();
    changes.observe(list, { childList: true });

    return () => {
      sizes?.disconnect();
      changes.disconnect();
    };
  }, [list, reserve, isExpanded]);

  return folded;
};

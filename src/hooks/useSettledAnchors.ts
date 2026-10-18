import { useEffect, useRef } from "react";

import { closestTo, focusLanding } from "@/packages/interaction/focus";
import { holdAtTop, settleAtTop } from "@/packages/interaction/scroll-frame";

// The element a link jumps to, when it is a link to somewhere on this page.
const targetOf = (link: HTMLAnchorElement) => (link.hash && link.origin === window.location.origin && link.pathname === window.location.pathname
  ? document.getElementById(decodeURIComponent(link.hash.slice(1)))
  : null);

// Every same page link (the menu, the first screen's chips, the scroll cue) is a smooth scroll, whether the
// browser, Next's Link or a handler of our own runs it. This makes each one land on its target even when
// sections load and change size as the scroll passes them, and takes keyboard focus there with it (Next's Link only
// scrolls), so the next Tab goes on from the section rather than from the menu.
// A page opened at such a link (from an application, a shared shortlist) lands on it too, once `canLand` (the intro
// has lifted and a view is chosen), and is held there while the sections above it finish loading: the browser's own
// jump comes while the page is still loading, so the target drifts as everything above it takes its size.
export default function useSettledAnchors(canLand: boolean) {
  const hasLanded = useRef(false);

  useEffect(() => {
    if (!canLand || hasLanded.current) {
      return undefined;
    }

    hasLanded.current = true;

    const target = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;

    if (!target) {
      return undefined;
    }

    const stop = holdAtTop(target);

    focusLanding(target.closest("[id^='section-']") ?? target);

    return stop;
  }, [canLand]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = closestTo(event.target, "a[href*='#']");
      const target = link instanceof HTMLAnchorElement ? targetOf(link) : null;

      // Opened in another tab or window: this page does not move.
      if (!target || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      settleAtTop(target);
      // The section the jump lands in, not the hidden anchor some links aim at, so a screen reader says where it is.
      focusLanding(target.closest("[id^='section-']") ?? target);
    };

    document.addEventListener("click", onClick);

    return () => document.removeEventListener("click", onClick);
  }, []);
}

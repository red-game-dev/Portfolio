import { useEffect } from "react";

import { closestTo, focusLanding } from "@/packages/interaction/focus";
import { settleAtTop } from "@/packages/interaction/scroll-frame";

// The element a link jumps to, when it is a link to somewhere on this page.
const targetOf = (link: HTMLAnchorElement) => (link.hash && link.origin === window.location.origin && link.pathname === window.location.pathname
  ? document.getElementById(decodeURIComponent(link.hash.slice(1)))
  : null);

// Every same page link (the menu, the first screen's chips, the scroll cue) is a smooth scroll, whether the
// browser, Next's Link or a handler of our own runs it. This makes each one land on its target even when
// sections load and change size as the scroll passes them, and takes keyboard focus there with it (Next's Link only
// scrolls), so the next Tab goes on from the section rather than from the menu.
export default function useSettledAnchors() {
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

import { useEffect } from "react";

import { settleAtTop } from "@/packages/interaction/scroll-frame";

// The element a link jumps to, when it is a link to somewhere on this page.
const targetOf = (link: HTMLAnchorElement) => (link.hash && link.origin === window.location.origin && link.pathname === window.location.pathname
  ? document.getElementById(decodeURIComponent(link.hash.slice(1)))
  : null);

// Every same page link (the menu, the first screen's chips, the scroll cue) is a smooth scroll, whether the
// browser, Next's Link or a handler of our own runs it. This makes each one land on its target even when
// sections load and change size as the scroll passes them.
export default function useSettledAnchors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
      const target = link ? targetOf(link) : null;

      if (target) {
        settleAtTop(target);
      }
    };

    document.addEventListener("click", onClick);

    return () => document.removeEventListener("click", onClick);
  }, []);
}

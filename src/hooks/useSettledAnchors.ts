import { useEffect } from "react";

import { settleAtTop } from "@/packages/interaction/scroll-frame";

// Every same page link (the menu, the first screen's chips, the scroll cue) is a native smooth scroll. This
// makes each one land on its target even when sections load and change size as the scroll passes them.
// Links whose own handler takes over (preventDefault) settle themselves through scrollToElement.
export default function useSettledAnchors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href^='#']") : null;
      const target = link && !event.defaultPrevented ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;

      if (target) {
        settleAtTop(target);
      }
    };

    document.addEventListener("click", onClick);

    return () => document.removeEventListener("click", onClick);
  }, []);
}

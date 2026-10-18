import { useEffect, useRef } from "react";

import { closestTo, focusLanding } from "@/packages/interaction/focus";
import { holdAtTop, settleAtTop, TAKE_OVER } from "@/packages/interaction/scroll-frame";

// The element a hash names, if any. A hash with a broken escape (a bare `%`, which browsers leave as typed) is read as
// it is rather than thrown on.
const elementOfHash = (hash: string): HTMLElement | null => {
  if (hash.length < 2) {
    return null;
  }

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
};

// The element a link jumps to, when it is a link to somewhere on this page.
const targetOf = (link: HTMLAnchorElement) => (link.origin === window.location.origin && link.pathname === window.location.pathname
  ? elementOfHash(link.hash)
  : null);

// Whether this page was opened anew rather than reloaded or returned to, when the browser puts the reader back where
// they were, which a landing must not undo.
const isFreshVisit = () => {
  const entry = performance.getEntriesByType?.("navigation")[0];
  const type = entry && "type" in entry ? entry.type : undefined;

  return type !== "reload" && type !== "back_forward";
};

// Every same page link (the menu, the first screen's chips, the scroll cue) is a smooth scroll, whether the
// browser, Next's Link or a handler of our own runs it. This makes each one land on its target even when
// sections load and change size as the scroll passes them, and takes keyboard focus there with it (Next's Link only
// scrolls), so the next Tab goes on from the section rather than from the menu.
// A page opened at such a link (from an application, say) lands on it too, once `canLand` (every section has its
// size), and is held there while the sections above it finish loading: the browser's own jump comes while the page is
// still loading, so the target drifts as everything above it takes its size. Not when the page was reloaded or
// returned to, nor once the reader has scrolled, tapped or typed on the page since it became `isReadable` (the intro
// lifted and a view chosen, so picking a view does not count): they are where they mean to be.
export default function useSettledAnchors({ isReadable, canLand }: { isReadable: boolean; canLand: boolean }) {
  const hasLanded = useRef(false);
  const hasTakenOver = useRef(false);

  useEffect(() => {
    if (!isReadable) {
      return undefined;
    }

    const takeOver = () => {
      hasTakenOver.current = true;
    };

    TAKE_OVER.forEach((type) => window.addEventListener(type, takeOver, { passive: true }));

    return () => TAKE_OVER.forEach((type) => window.removeEventListener(type, takeOver));
  }, [isReadable]);

  useEffect(() => {
    if (!canLand || hasLanded.current) {
      return undefined;
    }

    hasLanded.current = true;

    const target = elementOfHash(window.location.hash);

    if (!target || hasTakenOver.current || !isFreshVisit()) {
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

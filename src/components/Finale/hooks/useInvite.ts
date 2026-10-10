import { useCallback, useEffect, useState } from "react";

import { INVITE_KEY, InviteChoice, isInviteChoice, nextCount } from "@/components/Finale/invite";
import { usePageVisible } from "@/hooks/usePageVisible";
import { usePageHeld } from "@/hooks/useScrollLock";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { readStored, writeStored } from "@/packages/browser/storage";

interface InviteOptions {
  // The ship is in orbit, its board is on screen, and the voyage is not already open.
  isOrbit: boolean;
  isInView: boolean;
  isOpen: boolean;
  // The reader's focus is on the choice itself: the count holds where it is, so no one is rushed.
  isChoosing: boolean;
  open: () => void;
}

// Asks whether the reader wants to play: the first time, the journey goes on by itself once the count runs out,
// unless they say no thanks; after that it waits to be asked. A reader who prefers reduced motion is only asked:
// nothing opens by itself for them. The count only runs where it can be seen: not in a background tab, and not
// while another dialog holds the page. The answer is read after mount, so the server and the first client render
// agree, and nothing counts until it is read.
export const useInvite = ({ isOrbit, isInView, isOpen, isChoosing, open }: InviteOptions) => {
  // Undefined until storage is read, then the answer kept, or null if there is none yet.
  const [choice, setChoice] = useState<InviteChoice | null | undefined>(undefined);
  const [count, setCount] = useState<number | null>(null);
  const [isCalm, setIsCalm] = useState(false);
  const isVisible = usePageVisible();
  const isHeld = usePageHeld();
  const isWatching = choice === null && !isCalm && isOrbit && isInView && !isOpen && isVisible && !isHeld;

  useEffect(() => {
    setChoice(readStored(INVITE_KEY, isInviteChoice));
    setIsCalm(prefersReducedMotion());
  }, []);

  const settle = useCallback((next: InviteChoice) => {
    setChoice(next);
    setCount(null);
    writeStored(INVITE_KEY, next);
  }, []);

  useEffect(() => {
    setCount((current) => nextCount(current, { kind: "watch", isWatching }));
  }, [isWatching]);

  useEffect(() => {
    if (count === null || isChoosing) {
      return undefined;
    }

    if (count === 0) {
      settle("taken");
      open();

      return undefined;
    }

    const timer = window.setTimeout(() => setCount((current) => nextCount(current, { kind: "tick" })), 1000);

    return () => window.clearTimeout(timer);
  }, [count, isChoosing, open, settle]);

  const accept = useCallback(() => {
    if (choice === null) {
      settle("taken");
    }

    open();
  }, [choice, open, settle]);

  const decline = useCallback(() => settle("declined"), [settle]);

  return { count, accept, decline };
};

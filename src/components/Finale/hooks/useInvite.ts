import { useCallback, useEffect, useState } from "react";

import { INVITE_KEY, InviteChoice, isInviteChoice, nextCount } from "@/components/Finale/invite";
import { readStored, writeStored } from "@/packages/browser/storage";

interface InviteOptions {
  // The ship is in orbit, its board is on screen, and the voyage is not already open.
  isOrbit: boolean;
  isInView: boolean;
  isOpen: boolean;
  open: () => void;
}

// Asks whether the reader wants to play: the first time, the journey goes on by itself once the count runs out,
// unless they say no thanks; after that it waits to be asked. The answer is read after mount, so the server and
// the first client render agree, and nothing counts until it is read.
export const useInvite = ({ isOrbit, isInView, isOpen, open }: InviteOptions) => {
  // Undefined until storage is read, then the answer kept, or null if there is none yet.
  const [choice, setChoice] = useState<InviteChoice | null | undefined>(undefined);
  const [count, setCount] = useState<number | null>(null);
  const isWatching = choice === null && isOrbit && isInView && !isOpen;

  useEffect(() => {
    setChoice(readStored(INVITE_KEY, isInviteChoice));
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
    if (count === null) {
      return undefined;
    }

    if (count === 0) {
      settle("taken");
      open();

      return undefined;
    }

    const timer = window.setTimeout(() => setCount((current) => nextCount(current, { kind: "tick" })), 1000);

    return () => window.clearTimeout(timer);
  }, [count, open, settle]);

  const accept = useCallback(() => {
    if (choice === null) {
      settle("taken");
    }

    open();
  }, [choice, open, settle]);

  const decline = useCallback(() => settle("declined"), [settle]);

  return { count, accept, decline };
};

import { useCallback, useEffect, useState } from "react";

import { INVITE_KEY, InviteChoice, isInviteChoice } from "@/components/Finale/invite";
import { readStored, writeStored } from "@/packages/browser/storage";

// Asks whether the reader wants to play: until they answer, Yes and No thanks both stand; either answer is kept, and
// after it the way to play stays, without asking again. Nothing opens by itself, however long they look. The answer
// is read after mount, so the server and the first client render agree.
export const useInvite = (open: () => void) => {
  // Undefined until storage is read, then the answer kept, or null if there is none yet.
  const [choice, setChoice] = useState<InviteChoice | null | undefined>(undefined);

  useEffect(() => {
    setChoice(readStored(INVITE_KEY, isInviteChoice));
  }, []);

  const settle = useCallback((next: InviteChoice) => {
    setChoice(next);
    writeStored(INVITE_KEY, next);
  }, []);

  const accept = useCallback(() => {
    if (choice === null) {
      settle("taken");
    }

    open();
  }, [choice, open, settle]);

  const decline = useCallback(() => settle("declined"), [settle]);

  return { isAsking: choice === null, accept, decline };
};

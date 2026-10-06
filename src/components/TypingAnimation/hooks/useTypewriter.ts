import { useEffect, useState } from "react";

import { prefersReducedMotion } from "@/packages/accessibility/motion";

export interface TypewriterTiming {
  typeMs: number;
  deleteMs: number;
  holdMs: number;
}

export interface TypewriterState {
  index: number;
  typed: number;
}

const DEFAULT_TIMING: TypewriterTiming = { typeMs: 110, deleteMs: 45, holdMs: 1800 };

// Types each phrase out, holds it, deletes it and moves to the next, by character count only: the caller
// decides how the characters are drawn. With reduced motion every phrase shows whole and simply rotates.
export const useTypewriter = (lengths: number[], timing: TypewriterTiming = DEFAULT_TIMING): TypewriterState => {
  const [state, setState] = useState({ index: 0, typed: 0, isDeleting: false });

  useEffect(() => {
    const length = lengths[state.index] ?? 0;
    const isReduced = prefersReducedMotion();
    let delay = state.isDeleting ? timing.deleteMs : timing.typeMs;
    let next = state;

    if (isReduced) {
      delay = timing.holdMs * 1.5;
      next = { index: (state.index + 1) % lengths.length, typed: lengths[(state.index + 1) % lengths.length] ?? 0, isDeleting: false };
    } else if (!state.isDeleting && state.typed < length) {
      next = { ...state, typed: state.typed + 1 };
    } else if (!state.isDeleting) {
      delay = timing.holdMs;
      next = { ...state, isDeleting: true };
    } else if (state.typed > 0) {
      next = { ...state, typed: state.typed - 1 };
    } else {
      next = { index: (state.index + 1) % lengths.length, typed: 0, isDeleting: false };
    }

    const timeout = window.setTimeout(() => setState(next), delay);

    return () => window.clearTimeout(timeout);
  }, [lengths, state, timing]);

  return { index: state.index, typed: state.typed };
};

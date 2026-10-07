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

interface StepState extends TypewriterState {
  isDeleting: boolean;
}

interface Step {
  next: StepState;
  // How long to wait before taking it.
  delay: number;
}

const DEFAULT_TIMING: TypewriterTiming = { typeMs: 110, deleteMs: 45, holdMs: 1800 };

const INITIAL: StepState = { index: 0, typed: 0, isDeleting: false };

// The typewriter's next move: type a letter, hold the full phrase, delete a letter, or move to the next
// phrase. With reduced motion every phrase shows whole and simply rotates. No phrases, no move.
export const nextTypewriterStep = (state: StepState, lengths: number[], timing: TypewriterTiming, isReduced: boolean): Step | null => {
  if (lengths.length === 0) {
    return null;
  }

  const length = lengths[state.index] ?? 0;
  const following = (state.index + 1) % lengths.length;

  if (isReduced) {
    // The current phrase whole at once, then the next one whole after a hold.
    return state.typed < length
      ? { next: { ...state, typed: length, isDeleting: false }, delay: 0 }
      : { next: { index: following, typed: lengths[following], isDeleting: false }, delay: timing.holdMs * 1.5 };
  }

  if (!state.isDeleting) {
    return state.typed < length
      ? { next: { ...state, typed: state.typed + 1 }, delay: timing.typeMs }
      : { next: { ...state, isDeleting: true }, delay: timing.holdMs };
  }

  return state.typed > 0
    ? { next: { ...state, typed: state.typed - 1 }, delay: timing.deleteMs }
    : { next: { index: following, typed: 0, isDeleting: false }, delay: timing.deleteMs };
};

// Types each phrase out, holds it, deletes it and moves to the next, by character count only: the caller
// decides how the characters are drawn. Waits where it is while `isActive` is off, such as off screen.
export const useTypewriter = (lengths: number[], isActive = true, timing: TypewriterTiming = DEFAULT_TIMING): TypewriterState => {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    const step = isActive ? nextTypewriterStep(state, lengths, timing, prefersReducedMotion()) : null;

    if (!step) {
      return;
    }

    const timeout = window.setTimeout(() => setState(step.next), step.delay);

    return () => window.clearTimeout(timeout);
  }, [isActive, lengths, state, timing]);

  return { index: state.index, typed: state.typed };
};

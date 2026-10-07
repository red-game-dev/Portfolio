import { nextTypewriterStep } from "@/components/TypingAnimation/hooks/useTypewriter";

const TIMING = { typeMs: 100, deleteMs: 40, holdMs: 1000 };
const LENGTHS = [3, 2];

// Runs the typewriter from the start for `steps` moves and returns where it ends up.
const run = (steps: number, isReduced = false) => {
  let state = { index: 0, typed: 0, isDeleting: false };

  for (let move = 0; move < steps; move += 1) {
    state = nextTypewriterStep(state, LENGTHS, TIMING, isReduced)?.next ?? state;
  }

  return state;
};

describe("nextTypewriterStep", () => {
  it("types a phrase letter by letter, then holds it", () => {
    expect(run(3)).toEqual({ index: 0, typed: 3, isDeleting: false });
    expect(nextTypewriterStep(run(3), LENGTHS, TIMING, false)).toEqual({ next: { index: 0, typed: 3, isDeleting: true }, delay: 1000 });
  });

  it("deletes it at its own pace and moves to the next phrase, wrapping round", () => {
    expect(nextTypewriterStep(run(4), LENGTHS, TIMING, false)?.delay).toBe(40);
    expect(run(7)).toEqual({ index: 0, typed: 0, isDeleting: true });
    expect(run(8)).toEqual({ index: 1, typed: 0, isDeleting: false });
    // Phrase two: two letters, a hold, two deletions, then back to the first.
    expect(run(8 + 6)).toEqual({ index: 0, typed: 0, isDeleting: false });
  });

  it("shows whole phrases at once and rotates them with reduced motion", () => {
    expect(nextTypewriterStep({ index: 0, typed: 0, isDeleting: false }, LENGTHS, TIMING, true)).toEqual({ next: { index: 0, typed: 3, isDeleting: false }, delay: 0 });
    expect(run(2, true)).toEqual({ index: 1, typed: 2, isDeleting: false });
    expect(run(3, true)).toEqual({ index: 0, typed: 3, isDeleting: false });
  });

  it("does nothing without phrases", () => {
    expect(nextTypewriterStep({ index: 0, typed: 0, isDeleting: false }, [], TIMING, false)).toBeNull();
  });
});

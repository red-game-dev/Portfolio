import { useEffect, useMemo, useState } from "react";

import { DECODE_TIMING } from "@/components/DecodedText/config";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { decodeFrame, toBinaryMask } from "@/packages/encoding/binary";
import { clamp } from "@/packages/math/clamp";

interface DecodeProgress {
  revealed: number;
  tick: number;
}

const START: DecodeProgress = { revealed: 0, tick: 0 };

// Keeps the same object when nothing moved, so a reset that changes nothing does not render again.
const settleAt = (revealed: number, tick: number) => (previous: DecodeProgress): DecodeProgress =>
  (previous.revealed === revealed && previous.tick === tick ? previous : { revealed, tick });

// Starts as bits and resolves into `text` left to right once `isActive` turns true. Server and
// first client render both show the bits, so hydration always matches. `duration` caps the whole
// reveal for long text, which would otherwise take a character time per character. `isInstant` shows the
// text as soon as it is active, for readers who chose a view without the effect.
export const useDecodedText = (text: string, isActive: boolean, delay = 0, duration?: number, isInstant = false) => {
  const mask = useMemo(() => toBinaryMask(text), [text]);
  const length = useMemo(() => Array.from(text).length, [text]);
  const [progress, setProgress] = useState<DecodeProgress>(START);

  useEffect(() => {
    // Back to bits when it leaves, so it decodes again the next time it comes into view.
    if (!isActive) {
      setProgress(settleAt(0, 0));

      return;
    }

    if (isInstant || prefersReducedMotion()) {
      setProgress(settleAt(length, 0));

      return;
    }

    let frameId = 0;
    let startedAt: number | null = null;
    const characterMs = duration ? Math.min(DECODE_TIMING.characterMs, duration / Math.max(1, length)) : DECODE_TIMING.characterMs;

    const step = (time: number) => {
      startedAt = startedAt ?? time;

      const revealed = clamp(Math.floor((time - startedAt - delay) / characterMs), 0, length);
      const tick = Math.floor((time - startedAt) / DECODE_TIMING.tickMs);

      setProgress(settleAt(revealed, tick));

      if (revealed < length) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [delay, duration, isActive, isInstant, length]);

  // Views without the effect read the text as it is, whether or not it has been reached.
  return isInstant ? text : decodeFrame(text, mask, progress.revealed, progress.tick);
};

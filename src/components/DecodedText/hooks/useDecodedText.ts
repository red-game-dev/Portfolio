import { useEffect, useMemo, useState } from "react";

import { DECODE_TIMING } from "@/components/DecodedText/config";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { decodeFrame, toBinaryMask } from "@/packages/encoding/binary";

interface DecodeProgress {
  revealed: number;
  tick: number;
}

// Starts as bits and resolves into `text` left to right once `isActive` turns true. Server and
// first client render both show the bits, so hydration always matches. `duration` caps the whole
// reveal for long text, which would otherwise take a character time per character. `isInstant` shows the
// text as soon as it is active, for readers who chose a view without the effect.
export const useDecodedText = (text: string, isActive: boolean, delay = 0, duration?: number, isInstant = false) => {
  const mask = useMemo(() => toBinaryMask(text), [text]);
  const length = useMemo(() => Array.from(text).length, [text]);
  const [progress, setProgress] = useState<DecodeProgress>({ revealed: 0, tick: 0 });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (isInstant || prefersReducedMotion()) {
      setProgress({ revealed: length, tick: 0 });

      return;
    }

    let frameId = 0;
    let startedAt: number | null = null;
    const characterMs = duration ? Math.min(DECODE_TIMING.characterMs, duration / Math.max(1, length)) : DECODE_TIMING.characterMs;

    const step = (time: number) => {
      startedAt = startedAt ?? time;

      const revealed = Math.min(length, Math.max(0, Math.floor((time - startedAt - delay) / characterMs)));
      const tick = Math.floor((time - startedAt) / DECODE_TIMING.tickMs);

      setProgress((previous) => (previous.revealed === revealed && previous.tick === tick ? previous : { revealed, tick }));

      if (revealed < length) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [delay, duration, isActive, isInstant, length]);

  return decodeFrame(text, mask, progress.revealed, progress.tick);
};

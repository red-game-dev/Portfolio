import { useEffect, useMemo, useState } from "react";

import { DECODE_TIMING } from "@/components/DecodedText/config";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { decodeFrame, toBinaryMask } from "@/packages/encoding/binary";

interface DecodeProgress {
  revealed: number;
  tick: number;
}

// Starts as bits and resolves into `text` left to right once `isActive` turns true. Server and
// first client render both show the bits, so hydration always matches.
export const useDecodedText = (text: string, isActive: boolean, delay = 0) => {
  const mask = useMemo(() => toBinaryMask(text), [text]);
  const length = useMemo(() => Array.from(text).length, [text]);
  const [progress, setProgress] = useState<DecodeProgress>({ revealed: 0, tick: 0 });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (prefersReducedMotion()) {
      setProgress({ revealed: length, tick: 0 });

      return;
    }

    let frameId = 0;
    let startedAt: number | null = null;

    const step = (time: number) => {
      startedAt = startedAt ?? time;

      const revealed = Math.min(length, Math.max(0, Math.floor((time - startedAt - delay) / DECODE_TIMING.characterMs)));
      const tick = Math.floor((time - startedAt) / DECODE_TIMING.tickMs);

      setProgress((previous) => (previous.revealed === revealed && previous.tick === tick ? previous : { revealed, tick }));

      if (revealed < length) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [delay, isActive, length]);

  return decodeFrame(text, mask, progress.revealed, progress.tick);
};

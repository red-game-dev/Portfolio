import { PixelRevealConfig } from "../config";
import { PixelRevealFrame } from "../domain/types";

type TimelineConfig = Pick<PixelRevealConfig, "binaryMs" | "pixelsMs" | "enhanceMs" | "blockSizes">;

export const totalDuration = ({ binaryMs, pixelsMs, enhanceMs }: TimelineConfig) => binaryMs + pixelsMs + enhanceMs;

// Maps time since the reveal started onto a stage and the progress within it. Pure, so any moment of the
// reveal can be drawn, replayed or tested on its own.
export const frameAt = (elapsedMs: number, config: TimelineConfig): PixelRevealFrame => {
  const { binaryMs, pixelsMs, enhanceMs, blockSizes } = config;
  const finest = blockSizes[blockSizes.length - 1] ?? 1;
  const elapsed = Math.max(0, elapsedMs);

  if (elapsed < binaryMs) {
    return { stage: "binary", progress: elapsed / binaryMs, blockSize: blockSizes[0] ?? finest };
  }

  if (elapsed < binaryMs + pixelsMs) {
    const progress = (elapsed - binaryMs) / pixelsMs;
    const step = Math.min(blockSizes.length - 1, Math.floor(progress * blockSizes.length));

    return { stage: "pixels", progress, blockSize: blockSizes[step] ?? finest };
  }

  if (elapsed < totalDuration(config)) {
    return { stage: "enhance", progress: (elapsed - binaryMs - pixelsMs) / enhanceMs, blockSize: finest };
  }

  return { stage: "done", progress: 1, blockSize: 1 };
};

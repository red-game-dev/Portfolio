import { RigModel } from "@/packages/graphics/rig";

import { DEALER_PIVOT, DEALER_SIZE, DealerPainter, dealerMotion, MOUTH_STEPS, mouthStep } from "./DealerPainter";
import { DEFAULT_DEALER_LOOK, DealerLook, DealerOutfit } from "./outfits";

// Blinks come every few seconds and last a moment, drawn from three cached lid positions.
const BLINK_EVERY_MS = [2500, 5500] as const;
const BLINK_MS = 160;
const BLINK_STEPS = [0, 0.6, 1] as const;
// Sequins twinkle through this many cached frames.
const SPARKLE_FRAMES = 12;
const SPARKLE_FPS = 8;

// The dealer as a rig model: a body layer that breathes (and twinkles in sequins) and a head layer that
// sways, blinks and talks. "talk" is the cue the table plays when she calls a phase.
export const createDealerModel = (look: DealerLook = DEFAULT_DEALER_LOOK): RigModel<DealerOutfit> => {
  const painter = new DealerPainter(look);

  return {
    id: "dealer",
    width: DEALER_SIZE.width,
    height: DEALER_SIZE.height,
    layers: [
      {
        id: "body",
        keyChannels: (outfit) => (outfit.hasSparkle ? ["sparkle"] : []),
        paint: (context, outfit, channels) => painter.paintBody(context, outfit, channels.sparkle / SPARKLE_FPS),
        motion: (channels) => ({ y: channels.breath }),
      },
      {
        id: "head",
        keyChannels: ["blink", "mouth"],
        // The face, the hair in front and the long wave over her shoulder.
        bounds: { x: 44, y: 10, width: 112, height: 206 },
        paint: (context, outfit, channels) => painter.paintHead(context, outfit, BLINK_STEPS[channels.blink], MOUTH_STEPS[channels.mouth]),
        motion: (channels) => ({ y: channels.breath * 1.2, rotate: channels.sway, pivot: DEALER_PIVOT }),
      },
    ],
    channels: (timeMs, cues) => {
      const time = timeMs / 1000;
      const isTalking = cues.progress("talk") !== null;
      const pose = { time, isTalking, blink: 0 };
      const { breath, sway } = dealerMotion(pose);
      const blinkAt = cues.progress("blink");
      const closed = blinkAt === null ? 0 : 1 - Math.abs(blinkAt * 2 - 1);

      return {
        breath,
        sway,
        blink: closed > 0.75 ? 2 : closed > 0.25 ? 1 : 0,
        mouth: mouthStep(pose),
        sparkle: Math.floor(time * SPARKLE_FPS) % SPARKLE_FRAMES,
      };
    },
    setup: (animator) => {
      animator.every("blink", BLINK_EVERY_MS[0], BLINK_EVERY_MS[1], BLINK_MS);
    },
  };
};

import { RigModel } from "@/packages/graphics/rig";

import { DEFAULT_HERO_LOOK, HeroClass, HeroLook } from "./classes";
import { HERO_PIVOT, HERO_SIZE, HeroPainter } from "./HeroPainter";

const BLINK_EVERY_MS = [2800, 6000] as const;
const BLINK_MS = 150;
const BLINK_STEPS = [0, 0.6, 1] as const;
// The aura and the weapon pulse through this many cached steps.
const GLOW_STEPS = 6;
const GLOW_PERIOD_S = 2.4;

// The hero as a rig model: aura and cape behind, body, head and weapon. The body breathes, the head sways
// a touch and blinks, the weapon bobs and its glow pulses with the aura.
export const createHeroModel = (look: HeroLook = DEFAULT_HERO_LOOK): RigModel<HeroClass> => {
  const painter = new HeroPainter(look);
  const glowOf = (step: number) => step / (GLOW_STEPS - 1);

  return {
    id: "hero",
    width: HERO_SIZE.width,
    height: HERO_SIZE.height,
    layers: [
      {
        id: "aura",
        cache: false,
        paint: (context, hero, channels) => painter.paintAura(context, hero, channels.pulse),
      },
      {
        id: "cape",
        bounds: { x: 20, y: 140, width: 160, height: 100 },
        paint: (context, hero) => painter.paintCape(context, hero),
        motion: (channels) => ({ y: channels.breath * 0.5 }),
      },
      {
        id: "body",
        bounds: { x: 36, y: 100, width: 128, height: 140 },
        paint: (context, hero) => painter.paintBody(context, hero),
        motion: (channels) => ({ y: channels.breath }),
      },
      {
        id: "head",
        keyChannels: ["blink"],
        bounds: { x: 50, y: 0, width: 112, height: 126 },
        paint: (context, hero, channels) => painter.paintHead(context, hero, BLINK_STEPS[channels.blink]),
        motion: (channels) => ({ y: channels.breath * 1.2, rotate: channels.sway, pivot: HERO_PIVOT }),
      },
      {
        id: "prop",
        keyChannels: ["glow"],
        bounds: { x: 108, y: 58, width: 92, height: 182 },
        paint: (context, hero, channels) => painter.paintProp(context, hero, glowOf(channels.glow)),
        motion: (channels) => ({ y: channels.breath + channels.bob }),
      },
    ],
    channels: (timeMs, cues) => {
      const time = timeMs / 1000;
      const blinkAt = cues.progress("blink");
      const closed = blinkAt === null ? 0 : 1 - Math.abs(blinkAt * 2 - 1);
      const pulse = (Math.sin((time / GLOW_PERIOD_S) * Math.PI * 2) + 1) / 2;

      return {
        breath: Math.sin(time * 1.5) * 0.9,
        sway: Math.sin(time * 0.6) * 0.012,
        bob: Math.sin(time * 1.1 + 1) * 1.6,
        blink: closed > 0.75 ? 2 : closed > 0.25 ? 1 : 0,
        pulse,
        glow: Math.min(GLOW_STEPS - 1, Math.floor(pulse * GLOW_STEPS)),
      };
    },
    setup: (animator) => {
      animator.every("blink", BLINK_EVERY_MS[0], BLINK_EVERY_MS[1], BLINK_MS);
    },
  };
};

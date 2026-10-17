import { clamp01 } from "@/packages/math/clamp";
import { easeInOut } from "@/packages/math/easing";

import { CustomerMoments, CustomerPose } from "../domain/types";

// The customer paying by face is never still, as nobody standing is: she breathes, sways on her feet as standing people
// do (slow, a few millimetres, never quite repeating), turns her head a little, shifts her weight now and then, and
// blinks. With the story she looks down at the screen as it asks, leans in and dips her shoulder to tap it, holds still
// while her face is read, nods when it is approved, then straightens. All from the story's clock, so it plays the same
// way every time.

// Breaths a minute, and how far a breath lifts her head and leans it.
const BREATH = { period: 4200, rise: 1.6, lean: 0.8 } as const;

// Postural sway, front to back and side to side: a few slow waves at frequencies that never line up (Hz, millimetres).
const SWAY = {
  lean: [[0.11, 4, 1.3], [0.23, 2.2, 0.4], [0.47, 1, 2.1]],
  side: [[0.09, 3, 0.7], [0.19, 1.8, 2.6], [0.41, 0.8, 1.1]],
} as const;

// The head's own small movements (Hz, radians).
const HEAD = {
  turn: [[0.17, 0.012, 0.5], [0.53, 0.006, 0]],
  nod: [[0.23, 0.01, 1.9], [0.61, 0.004, 0.8]],
  roll: [[0.13, 0.008, 0.2]],
} as const;

// Her weight moving from one foot to the other and back over a period, the shoulders dropping towards it.
const WEIGHT = { period: 14000, side: 12, roll: 0.015 } as const;

// Looking down at the screen as it asks, leaning in to tap, the nod on approval.
const ATTENTION = { ease: 500, lean: 10, nod: 0.06, relax: 900 } as const;
const TAP = { before: 350, after: 450, lean: 8, roll: 0.04, turn: -0.05 } as const;
const NOD = { ms: 700, angle: 0.09 } as const;
// How still she holds while her face is read, 0 to 1 of her sway taken away.
const HOLD = { sway: 0.85, head: 0.85, ease: 250 } as const;

// Blinks: the gaps between them (milliseconds, played in turn), and how long the lids take to close and open.
const BLINK = { gaps: [2600, 4100, 3300, 5200, 2900], close: 60, open: 110 } as const;
const BLINK_CYCLE = BLINK.gaps.reduce((total, gap) => total + gap, 0);

type Waves = ReadonlyArray<readonly [number, number, number]>;

const waves = (list: Waves, seconds: number) =>
  list.reduce((total, [hertz, size, phase]) => total + size * Math.sin(2 * Math.PI * hertz * seconds + phase), 0);

// 0 before `from`, 1 after `to`, eased between.
const ramp = (ms: number, from: number, to: number) => easeInOut(clamp01((ms - from) / Math.max(to - from, 1)));

// A rise and fall over a window, 0 outside it.
const bell = (ms: number, from: number, to: number) => (ms <= from || ms >= to ? 0 : Math.sin(Math.PI * ((ms - from) / (to - from))));

const blinkAt = (ms: number): number => {
  let at = ((ms % BLINK_CYCLE) + BLINK_CYCLE) % BLINK_CYCLE;

  for (const gap of BLINK.gaps) {
    if (at < gap) {
      const into = at - (gap - BLINK.close - BLINK.open);

      if (into < 0) {
        return 0;
      }

      return into < BLINK.close ? into / BLINK.close : 1 - (into - BLINK.close) / BLINK.open;
    }

    at -= gap;
  }

  return 0;
};

export const STILL_CUSTOMER: CustomerPose = { lean: 0, side: 0, rise: 0, turn: 0, nod: 0, roll: 0, blink: 0 };

export const customerPoseAt = (ms: number, moments: CustomerMoments): CustomerPose => {
  const seconds = ms / 1000;
  const breath = Math.sin((2 * Math.PI * ms) / BREATH.period);
  // Nobody shifts their weight while holding still for a camera: its clock waits through the read, then goes on.
  const weightClock = ms - Math.min(Math.max(ms - moments.looked, 0), moments.matched - moments.looked);
  const weight = Math.tanh(3 * Math.sin((2 * Math.PI * weightClock) / WEIGHT.period));
  const holding = ramp(ms, moments.looked - HOLD.ease, moments.looked) * (1 - ramp(ms, moments.matched, moments.matched + HOLD.ease));
  const sway = 1 - HOLD.sway * holding;
  const head = 1 - HOLD.head * holding;
  const attention = ramp(ms, moments.asked, moments.asked + ATTENTION.ease) * (1 - ramp(ms, moments.approved, moments.approved + ATTENTION.relax));
  const tap = bell(ms, moments.press - TAP.before, moments.press + TAP.after);
  const nod = bell(ms, moments.approved, moments.approved + NOD.ms);

  return {
    lean: BREATH.lean * breath + waves(SWAY.lean, seconds) * sway + ATTENTION.lean * attention + TAP.lean * tap,
    side: waves(SWAY.side, seconds) * sway + WEIGHT.side * weight * sway,
    rise: BREATH.rise * breath,
    turn: waves(HEAD.turn, seconds) * head + TAP.turn * tap,
    nod: waves(HEAD.nod, seconds) * head + ATTENTION.nod * attention + NOD.angle * nod,
    roll: waves(HEAD.roll, seconds) * head + WEIGHT.roll * weight * sway + TAP.roll * tap,
    blink: blinkAt(ms),
  };
};

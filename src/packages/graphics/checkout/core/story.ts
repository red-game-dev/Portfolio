import { clamp01 } from "@/packages/math/clamp";

import { CheckoutCamera, CheckoutFrame, CheckoutGesture, CheckoutTrail, CheckoutVariant, Pose, ScreenState } from "../domain/types";
import { appCentre, BODY, CARD, keyCentre, OK_KEY, SCENE, STRIPE } from "./geometry";

// The story of one payment, timed in milliseconds at a real counter's pace and read as a share of its length (0
// to 1): where each hand and what the customer holds stand, what the terminal's screen shows, and where the camera
// looks. Everything the scene draws comes from here, so the story can be tested without a canvas and drawn at any
// moment.

type Key<T> = [number, T];

const smooth = (k: number) => k * k * (3 - 2 * k);

const smoother = (k: number) => k * k * k * (k * (k * 6 - 15) + 10);

// How far past its mark a hand goes as it arrives, before it settles back.
const OVERSHOOT = 1.1;

const arrive = (k: number) => {
  const p = smooth(k) - 1;

  return 1 + p * p * ((OVERSHOOT + 1) * p + OVERSHOOT);
};

// A long move bows sideways (always upwards, as a hand lifts on its way) and grows as it nears the camera.
const ARC = 0.09;

const RISE = 0.07;

// Moves shorter than this are a press or a nudge, eased straight.
const LONG_MOVE = 10;

const mixPose = (from: Pose, to: Pose, k: number): Pose => ({
  x: from.x + (to.x - from.x) * k,
  y: from.y + (to.y - from.y) * k,
  angle: from.angle + (to.angle - from.angle) * k,
  scale: from.scale + (to.scale - from.scale) * k,
});

const segmentOf = <T>(keys: Array<Key<T>>, t: number): { from: T; to: T; k: number } => {
  if (t <= keys[0][0]) {
    return { from: keys[0][1], to: keys[0][1], k: 0 };
  }

  for (let index = 1; index < keys.length; index += 1) {
    const [at, value] = keys[index];

    if (t <= at) {
      const [start, previous] = keys[index - 1];

      return { from: previous, to: value, k: clamp01((t - start) / Math.max(at - start, 1e-6)) };
    }
  }

  const last = keys[keys.length - 1][1];

  return { from: last, to: last, k: 1 };
};

// A pose between keyframes: a press eased straight, a long move along an arc that settles past its mark.
const poseAt = (keys: Array<Key<Pose>>, t: number): Pose => {
  const { from, to, k } = segmentOf(keys, t);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance < LONG_MOVE) {
    return mixPose(from, to, smooth(k));
  }

  const swing = Math.sin(Math.PI * k);
  // Of the two sides of the move, the one facing up the scene.
  const side = dx > 0 ? 1 : -1;
  const pose = mixPose(from, to, arrive(k));
  const bow = ARC * Math.min(distance, 120) * swing;

  return {
    ...pose,
    x: pose.x + (dy / distance) * side * bow,
    y: pose.y - (dx / distance) * side * bow,
    scale: pose.scale + RISE * Math.min(1, distance / 60) * swing,
  };
};

const cameraAt = (keys: Array<Key<CheckoutCamera>>, t: number): CheckoutCamera => {
  const { from, to, k } = segmentOf(keys, t);
  const eased = smoother(k);

  return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased, zoom: from.zoom + (to.zoom - from.zoom) * eased };
};

const valueAt = (keys: Array<Key<number>>, t: number): number => {
  const { from, to, k } = segmentOf(keys, t);

  return from + (to - from) * smooth(k);
};

const within = (t: number, from: number, to: number) => t >= from && t < to;

// Where each hand waits off the scene, nearer the camera than the terminal: the cashier's above it on the left, the
// customer's below it on the right.
const REST = {
  cashier: { x: 6, y: -100, angle: 0.75, scale: 1.12 },
  point: { x: 352, y: 268, angle: Math.PI + 0.62, scale: 1.12 },
  grip: { x: 390, y: 296, angle: 1.15, scale: 1.1 },
} as const;

// The fingertip over a key, lifted towards the camera, then pressed into the glass.
const HOVER = { lift: 4, scale: 1.035 };

const PRESSED = 0.985;

const over = (point: { x: number; y: number }, angle: number, lift = 0): Pose => ({
  x: point.x,
  y: point.y - lift,
  angle,
  scale: lift === 0 ? PRESSED : HOVER.scale,
});

// The turn each pointing hand keys at: the cashier's from the top left, the customer's from the bottom right.
export const CASHIER_ANGLE = 0.78;

export const POINT_ANGLE = Math.PI + 0.66;

// What the customer holds, by its centre, through each way to pay: where it waits, where it meets the terminal,
// and, for a swipe, where the swipe ends.
const ITEM_REST: Record<CheckoutGesture, Pose> = {
  tap: { x: 375, y: 160, angle: 0.35, scale: 1.1 },
  wallet: { x: 370, y: 175, angle: 0.3, scale: 1.1 },
  scan: { x: 370, y: 185, angle: 0.3, scale: 1.1 },
  insert: { x: 330, y: 280, angle: 0.4, scale: 1.1 },
  swipe: { x: 240, y: -70, angle: 0.15, scale: 1.1 },
};

const portraitHalf = CARD.long / 2;

const ITEM_AT: Record<CheckoutGesture, Pose[]> = {
  // Over the contactless sign in the middle of the screen, then pressed to the glass.
  tap: [{ x: 153, y: 77, angle: -0.06, scale: 1.02 }, { x: 153, y: 79, angle: -0.04, scale: 0.99 }],
  wallet: [{ x: 152, y: 82, angle: -0.08, scale: 1.02 }, { x: 152, y: 84, angle: -0.06, scale: 0.99 }],
  // Held up beside the screen, its camera on the QR code.
  scan: [{ x: 214, y: 70, angle: -0.2, scale: 1.04 }, { x: 213, y: 71, angle: -0.19, scale: 1.03 }],
  // Under the chip reader at the foot, then pushed up into it.
  insert: [
    { x: 150, y: BODY.y + BODY.height + portraitHalf + 10, angle: 0, scale: 1 },
    { x: 150, y: BODY.y + BODY.height + portraitHalf - 30, angle: 0, scale: 1 },
  ],
  // Down the stripe reader at the side, top to bottom.
  swipe: [{ x: STRIPE.x + 13, y: STRIPE.top - 4, angle: 0, scale: 1 }, { x: STRIPE.x + 13, y: STRIPE.bottom + 4, angle: 0, scale: 1 }],
};

const SWIPED_AWAY: Pose = { x: 250, y: 290, angle: 0.3, scale: 1.1 };

// The customer's hand grips what they hold: a landscape card by its right end, a card in a reader by its bottom
// end, a phone by its lower right.
const gripOf = (gesture: CheckoutGesture, item: Pose): Pose => {
  const isPortrait = gesture === "insert" || gesture === "swipe";
  const isPhone = gesture === "wallet" || gesture === "scan";
  const offset = isPortrait ? { x: 2, y: portraitHalf - 5 } : isPhone ? { x: 8, y: 17 } : { x: CARD.long / 2 - 7, y: 2 };
  const turn = isPortrait ? 1.2 : isPhone ? 0.55 : 0;
  const cos = Math.cos(item.angle);
  const sin = Math.sin(item.angle);

  return { x: item.x + offset.x * cos - offset.y * sin, y: item.y + offset.x * sin + offset.y * cos, angle: item.angle + turn, scale: item.scale };
};

// The PIN the customer keys on the terminal for a chip card: four digits and OK.
const PIN_KEYS = [4, 6, 2, 1];

// A real counter's pace, in milliseconds. The customer reaches over, holds the card or phone to the terminal until
// it is read, and the bank answers.
interface Pace {
  // From the app opening to the card or phone at the terminal.
  reach: number;
  // How long a card or phone stays at the terminal to be read.
  hold: Record<"tap" | "wallet" | "scan", number>;
  // From the card read (or the PIN confirmed) to the bank's answer.
  answer: Record<CheckoutGesture, number>;
  // Pushing a card into the reader, and swiping it down the stripe.
  insert: number;
  swipe: number;
  // What the customer holds, back off the scene.
  back: number;
  print: number;
  // The approval on the screen before the story ends.
  linger: number;
}

const FULL: Pace = {
  reach: 360,
  hold: { tap: 420, wallet: 480, scan: 560 },
  answer: { tap: 460, wallet: 420, scan: 520, swipe: 700, insert: 800 },
  insert: 200,
  swipe: 200,
  back: 380,
  print: 480,
  linger: 950,
};

const QUICK: Pace = {
  reach: 300,
  hold: { tap: 260, wallet: 280, scan: 300 },
  answer: { tap: 150, wallet: 150, scan: 170, swipe: 220, insert: 260 },
  insert: 120,
  swipe: 150,
  back: 320,
  print: 300,
  linger: 0,
};

// How long the quick story runs: the length of a drawing's switch.
export const QUICK_STORY_MS = 1400;

// The cashier's keying, in milliseconds: the first key, the gap between keys, over a key before pressing it, a key
// held down, the app after OK, the hand gone after the app, and the screen asking after the app.
const KEYING = { first: 200, gap: 150, hover: 25, pressed: 45, app: 180, away: 320, ask: 90 } as const;

// The customer's PIN, a little slower than the cashier's keying, and the hand away after OK.
const PIN = { first: 360, gap: 170, away: 340 } as const;

// How long the customer's hand takes to let go of a card in the reader, or to come back for it.
const LET_GO = 200;

// The camera: the whole counter, pushed in on the screen while the cashier keys, and on each way of paying.
const WIDE: CheckoutCamera = { x: SCENE.width / 2, y: SCENE.height / 2, zoom: 1 };

const ON_SCREEN: CheckoutCamera = { x: 150, y: 80, zoom: 1.5 };

const ON_PIN: CheckoutCamera = { x: 150, y: 84, zoom: 1.45 };

const MEET_CAMERA: Record<CheckoutGesture, CheckoutCamera> = {
  tap: { x: 160, y: 80, zoom: 1.38 },
  wallet: { x: 160, y: 84, zoom: 1.36 },
  scan: { x: 182, y: 86, zoom: 1.28 },
  swipe: { x: 178, y: 98, zoom: 1.3 },
  insert: { x: 150, y: 132, zoom: 1.32 },
};

// The most the camera zooms in, for the rig to cache its frames sharp enough.
export const MAX_ZOOM = 1.5;

// The quick story only leans in a little; the camera follows a fingertip by a share of its distance.
const QUICK_ZOOM = 1.14;

const FOLLOW = 0.16;

// 1 while the hand holds what it carries, easing to 0 as it lets go and back as it returns.
const holdOf = (follows: Array<[number, number]>, t: number): number => {
  const gap = follows.reduce((nearest, [from, to]) => {
    if (t >= from && t < to) {
      return 0;
    }

    return Math.min(nearest, t < from ? from - t : t - to);
  }, Number.POSITIVE_INFINITY);

  return smooth(Math.max(0, 1 - gap / LET_GO));
};

interface Built {
  end: number;
  cashier: Array<Key<Pose>>;
  point: Array<Key<Pose>>;
  item: Array<Key<Pose>>;
  // Where the grip hand follows the item, and where it lets go of it (a card left in the reader).
  gripFollows: Array<[number, number]>;
  screen: Array<Key<ScreenState>>;
  // When each key or app is pressed, for the screen's typed count and its pressed highlight.
  keyTaps: Array<{ at: number; key: number }>;
  appTap: { at: number; app: number } | null;
  pinTaps: number[];
  waves: [number, number] | null;
  sweep: [number, number] | null;
  approved: number;
  printed: [number, number];
  camera: Array<Key<CheckoutCamera>>;
  // How much the camera follows the fingertip on the screen, 0 to 1.
  follow: Array<Key<number>>;
}

// A key pressed: the fingertip over it, pressed into the glass, then lifted a little on its way to the next.
const pressKey = (keys: Array<Key<Pose>>, point: { x: number; y: number }, angle: number, at: number, lift: number) => {
  keys.push([at - KEYING.hover, over(point, angle, lift)]);
  keys.push([at, over(point, angle)]);
  keys.push([at + KEYING.pressed, over(point, angle, lift * 0.75)]);
};

// The cashier keys the amount, confirms it and opens the app for the way to pay; returns when the app is opened.
const keyIn = (built: Built, app: number, keys: number[]): number => {
  [...keys, OK_KEY].forEach((key, index) => {
    const at = KEYING.first + index * KEYING.gap;

    pressKey(built.cashier, keyCentre(key), CASHIER_ANGLE, at, HOVER.lift);

    if (index < keys.length) {
      built.keyTaps.push({ at, key });
    }
  });

  const okAt = KEYING.first + keys.length * KEYING.gap;
  const appAt = okAt + KEYING.app;

  pressKey(built.cashier, appCentre(app), CASHIER_ANGLE, appAt, HOVER.lift);
  built.cashier.push([appAt + KEYING.away, REST.cashier]);
  built.appTap = { at: appAt, app };
  built.screen.push([KEYING.first - 30, "keying"], [okAt + 50, "apps"], [appAt + KEYING.ask, "ask"]);
  built.camera.push([60, WIDE], [KEYING.first + 160, ON_SCREEN], [appAt + 40, ON_SCREEN]);
  built.follow.push([KEYING.first, 1], [appAt + 40, 1], [appAt + 260, 0]);

  return appAt;
};

// A chip card: the customer keys the PIN with the other hand and confirms it; returns when OK is pressed.
const keyPin = (built: Built, inserted: number): number => {
  const from = inserted + PIN.first;
  const okAt = from + PIN_KEYS.length * PIN.gap;

  built.point.push([inserted + 60, REST.point]);
  PIN_KEYS.forEach((key, index) => {
    const at = from + index * PIN.gap;

    built.pinTaps.push(at);
    pressKey(built.point, keyCentre(key), POINT_ANGLE, at, -HOVER.lift);
  });
  pressKey(built.point, keyCentre(OK_KEY), POINT_ANGLE, okAt, -HOVER.lift);
  built.point.push([okAt + PIN.away, REST.point]);
  built.screen.push([inserted + 120, "pin"]);
  built.camera.push([inserted + 160, MEET_CAMERA.insert], [from - 80, ON_PIN], [okAt + 120, ON_PIN]);
  built.follow.push([from - 120, 0], [from, 1], [okAt, 1], [okAt + 200, 0]);

  return okAt;
};

const build = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): Built => {
  const isFull = variant === "full";
  const pace = isFull ? FULL : QUICK;
  const built: Built = {
    end: 0,
    cashier: [[0, REST.cashier]],
    point: [[0, REST.point]],
    item: [],
    gripFollows: [[0, Number.POSITIVE_INFINITY]],
    screen: [[0, isFull ? "idle" : "ask"]],
    keyTaps: [],
    appTap: null,
    pinTaps: [],
    waves: null,
    sweep: null,
    approved: 0,
    printed: [0, 0],
    camera: [[0, WIDE]],
    follow: [[0, 0]],
  };
  // The customer moves as the app opens; the quick story starts with the screen already asking.
  const start = isFull ? keyIn(built, app, keys) + 40 : 0;
  const reach = start + pace.reach;
  const [first, second] = ITEM_AT[gesture];
  const rest = ITEM_REST[gesture];
  let processing: number;
  let approved: number;
  let settled: number;

  built.camera.push([reach, isFull ? MEET_CAMERA[gesture] : { ...MEET_CAMERA[gesture], zoom: QUICK_ZOOM }]);

  if (gesture === "insert") {
    // Into the reader, then (in the full story) the PIN on the screen with the other hand, then out again.
    const inserted = reach + pace.insert;

    if (isFull) {
      const okAt = keyPin(built, inserted);

      processing = okAt + 40;
      approved = okAt + pace.answer.insert;
      // The hand lets go once the card is in, and comes back for it once the payment is approved.
      built.gripFollows = [[0, inserted], [approved + 200 - LET_GO, Number.POSITIVE_INFINITY]];
    } else {
      processing = inserted + 60;
      approved = inserted + pace.answer.insert;
    }

    const out = approved + (isFull ? 200 : 100);
    const pulled = out + (isFull ? 160 : 100);

    settled = pulled + pace.back;
    built.item = [[0, rest], [start, rest], [reach, first], [inserted, second], [out, second], [pulled, first], [settled, rest]];
  } else if (gesture === "swipe") {
    const swiped = reach + pace.swipe;

    settled = swiped + pace.back;
    built.item = [[0, rest], [start, rest], [reach, first], [swiped, second], [settled, SWIPED_AWAY]];
    processing = swiped + 30;
    approved = swiped + pace.answer.swipe;
  } else {
    // Held to the terminal until it is read: pressed in for a tap or a wallet, still while a phone reads the QR.
    const hold = pace.hold[gesture];
    const read = Math.min(120, hold * 0.3);
    const leave = reach + hold;

    settled = leave + pace.back;
    built.item = [[0, rest], [start, rest], [reach, first], [reach + read, second], [leave, first], [settled, rest]];

    if (gesture === "scan") {
      built.sweep = [reach, leave];
    } else {
      built.waves = [reach, leave];
    }

    processing = leave - read;
    approved = leave + pace.answer[gesture];
  }

  built.screen.push([processing, "processing"], [approved, "approved"]);
  built.screen.sort((one, two) => one[0] - two[0]);
  built.approved = approved;
  built.printed = [approved + 60, approved + 60 + pace.print];
  built.camera.push([approved, built.camera[built.camera.length - 1][1]], [approved + (isFull ? 750 : 420), WIDE]);
  built.end = isFull ? Math.max(approved + pace.linger, settled + 200, built.printed[1] + 300) : QUICK_STORY_MS;
  built.cashier.push([built.end, REST.cashier]);
  built.point.push([built.end, REST.point]);

  return built;
};

const cache = new Map<string, Built>();

const storyOf = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): Built => {
  const key = `${variant}:${gesture}:${app}:${keys.join(",")}`;
  const made = cache.get(key) ?? build(variant, gesture, app, keys);

  cache.set(key, made);

  return made;
};

// How long a payment's story runs, in milliseconds.
export const storyMs = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): number =>
  storyOf(variant, gesture, app, keys).end;

// The share of the story at which the payment is approved, for the page to say so at that moment.
export const approvedAt = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): number => {
  const story = storyOf(variant, gesture, app, keys);

  return story.approved / story.end;
};

const stateAt = (keys: Array<Key<ScreenState>>, t: number): ScreenState =>
  keys.reduce((state, [at, next]) => (t >= at ? next : state), keys[0][1]);

const isOffScene = (pose: Pose) => pose.x < -60 || pose.x > 360 || pose.y < -60 || pose.y > 270;

const shown = (pose: Pose) => (isOffScene(pose) ? null : pose);

// How far back the motion blur looks, a frame at a time.
const TRAIL_MS = [16, 32];

// A card going into a reader passes behind the terminal's body.
const isBehind = (gesture: CheckoutGesture) => gesture === "insert" || gesture === "swipe";

const partsAt = (story: Built, gesture: CheckoutGesture, ms: number): CheckoutTrail => {
  const item = poseAt(story.item, ms);

  return {
    cashier: shown(poseAt(story.cashier, ms)),
    customerGrip: shown(mixPose(REST.grip, gripOf(gesture, item), holdOf(story.gripFollows, ms))),
    customerPoint: shown(poseAt(story.point, ms)),
    item: shown(item),
  };
};

const WAITING: Omit<CheckoutFrame, "screen"> = {
  cashier: null,
  customerGrip: null,
  customerPoint: null,
  item: null,
  isItemBehind: false,
  waves: 0,
  sweep: 0,
  receipt: 0,
  camera: WIDE,
  trail: [],
};

// The scene at a share of the story (null for waiting, before or after a payment).
export const checkoutAt = (t: number | null, variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): CheckoutFrame => {
  const story = storyOf(variant, gesture, app, keys);

  if (t === null) {
    return { ...WAITING, screen: { state: variant === "full" ? "idle" : "ask", typed: 0, pin: 0, pressed: null, spinner: 0 } };
  }

  const ms = clamp01(t) * story.end;
  const parts = partsAt(story, gesture, ms);
  const state = stateAt(story.screen, ms);
  const keyPressed = story.keyTaps.find(({ at }) => within(ms, at, at + KEYING.pressed));
  const pinPressed = story.pinTaps.findIndex((at) => within(ms, at, at + KEYING.pressed));
  const isAppPressed = story.appTap !== null && within(ms, story.appTap.at, story.appTap.at + KEYING.pressed);
  const span = (range: [number, number] | null) => (range && ms >= range[0] && ms < range[1] ? (ms - range[0]) / (range[1] - range[0]) : 0);
  const processingFrom = story.screen.find(([, next]) => next === "processing")?.[0] ?? story.approved;
  const base = cameraAt(story.camera, ms);
  const fingertip = parts.customerPoint ?? parts.cashier;
  const follow = fingertip ? valueAt(story.follow, ms) * FOLLOW : 0;

  return {
    ...parts,
    isItemBehind: isBehind(gesture),
    screen: {
      state,
      typed: story.keyTaps.filter(({ at }) => ms >= at).length,
      pin: story.pinTaps.filter((at) => ms >= at).length,
      pressed: keyPressed ? keyPressed.key : pinPressed >= 0 ? PIN_KEYS[pinPressed] : isAppPressed ? story.appTap?.app ?? null : null,
      spinner: state === "processing" ? (ms - processingFrom) / Math.max(story.approved - processingFrom, 1e-6) : 0,
    },
    waves: story.waves ? Math.sin(Math.PI * span(story.waves)) : 0,
    sweep: span(story.sweep),
    receipt: span(story.printed) || (ms >= story.printed[1] ? 1 : 0),
    camera: fingertip ? { ...base, x: base.x + (fingertip.x - base.x) * follow, y: base.y + (fingertip.y - base.y) * follow } : base,
    trail: TRAIL_MS.map((back) => partsAt(story, gesture, Math.max(0, ms - back))),
  };
};

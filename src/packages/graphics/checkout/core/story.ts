import { CheckoutFrame, CheckoutGesture, CheckoutVariant, Pose, ScreenState } from "../domain/types";
import { appCentre, BODY, CARD, keyCentre, OK_KEY, STRIPE } from "./geometry";

// The story of one payment as a pure function of how far through it is (0 to 1): where each hand and what the
// customer holds stand, and what the terminal's screen shows. Everything the scene draws comes from here, so the
// story can be tested without a canvas and drawn at any moment.

type Key<T> = [number, T];

const smooth = (k: number) => k * k * (3 - 2 * k);

const mixPose = (from: Pose, to: Pose, k: number): Pose => ({
  x: from.x + (to.x - from.x) * k,
  y: from.y + (to.y - from.y) * k,
  angle: from.angle + (to.angle - from.angle) * k,
});

// A pose between keyframes, eased in and out between each pair.
const poseAt = (keys: Array<Key<Pose>>, t: number): Pose => {
  if (t <= keys[0][0]) {
    return keys[0][1];
  }

  for (let index = 1; index < keys.length; index += 1) {
    const [at, pose] = keys[index];

    if (t <= at) {
      const [from, previous] = keys[index - 1];

      return mixPose(previous, pose, smooth((t - from) / Math.max(at - from, 1e-6)));
    }
  }

  return keys[keys.length - 1][1];
};

const within = (t: number, from: number, to: number) => t >= from && t < to;

// Where each hand waits off the scene: the cashier's above it on the left, the customer's below it on the right.
const REST = {
  cashier: { x: 20, y: -80, angle: 0.75 },
  point: { x: 345, y: 255, angle: Math.PI + 0.62 },
  grip: { x: 362, y: 280, angle: 1.15 },
} as const;

// How long the customer's hand takes to let go of a card in the reader, or to come back for it.
const LET_GO = 0.06;

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

// The cashier's fingertip over a key, and pressing it.
const over = (point: { x: number; y: number }, angle: number, lift = 0): Pose => ({ x: point.x, y: point.y - lift, angle });

const CASHIER_ANGLE = 0.78;

const POINT_ANGLE = Math.PI + 0.66;

// What the customer holds, by its centre, through each way to pay: where it waits, where it meets the terminal,
// and, for a swipe, where the swipe ends.
const ITEM_REST: Record<CheckoutGesture, Pose> = {
  tap: { x: 365, y: 150, angle: 0.35 },
  wallet: { x: 360, y: 165, angle: 0.3 },
  scan: { x: 360, y: 175, angle: 0.3 },
  insert: { x: 320, y: 270, angle: 0.4 },
  swipe: { x: 240, y: -60, angle: 0.15 },
};

const portraitHalf = CARD.long / 2;

const ITEM_AT: Record<CheckoutGesture, Pose[]> = {
  // Over the contactless sign at the top of the screen, then pressed in a moment.
  tap: [{ x: 152, y: 50, angle: -0.06 }, { x: 152, y: 53, angle: -0.04 }],
  wallet: [{ x: 151, y: 56, angle: -0.08 }, { x: 151, y: 59, angle: -0.06 }],
  // Held up beside the screen, its camera on the QR code.
  scan: [{ x: 214, y: 70, angle: -0.2 }, { x: 213, y: 71, angle: -0.19 }],
  // Under the chip reader at the foot, then pushed up into it.
  insert: [{ x: 150, y: BODY.y + BODY.height + portraitHalf + 10, angle: 0 }, { x: 150, y: BODY.y + BODY.height + portraitHalf - 30, angle: 0 }],
  // Down the stripe reader at the side, top to bottom.
  swipe: [{ x: STRIPE.x + 13, y: STRIPE.top - 4, angle: 0 }, { x: STRIPE.x + 13, y: STRIPE.bottom + 4, angle: 0 }],
};

// The customer's hand grips what they hold: a landscape card by its right end, a card in a reader by its bottom
// end, a phone by its lower right.
const gripOf = (gesture: CheckoutGesture, item: Pose): Pose => {
  const isPortrait = gesture === "insert" || gesture === "swipe";
  const isPhone = gesture === "wallet" || gesture === "scan";
  const offset = isPortrait ? { x: 2, y: portraitHalf - 4 } : isPhone ? { x: 9, y: 18 } : { x: CARD.long / 2 - 6, y: 3 };
  const turn = isPortrait ? 1.15 : isPhone ? 0.55 : 0;
  const cos = Math.cos(item.angle);
  const sin = Math.sin(item.angle);

  return { x: item.x + offset.x * cos - offset.y * sin, y: item.y + offset.x * sin + offset.y * cos, angle: item.angle + turn };
};

// The PIN the customer keys on the terminal for a chip card: four digits and OK.
const PIN_KEYS = [4, 6, 2, 1];

interface Timing {
  // The screen asks to pay from here; the customer's hand leaves its rest.
  ask: number;
  // The item reaches the terminal.
  reach: number;
}

interface Built {
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
}

const TAP_MS = 0.022;

const build = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): Built => {
  const isFull = variant === "full";
  const cashier: Array<Key<Pose>> = [[0, REST.cashier]];
  const keyTaps: Array<{ at: number; key: number }> = [];
  let appTap: Built["appTap"] = null;
  let timing: Timing = { ask: 0, reach: 0.26 };

  if (isFull) {
    // The cashier keys the amount, confirms it and opens the app for the way to pay.
    const step = 0.042;
    const sequence = [...keys, OK_KEY];
    let at = 0.1;

    cashier.push([0.05, REST.cashier]);
    sequence.forEach((key, index) => {
      const point = keyCentre(key);

      cashier.push([at - 0.018, over(point, CASHIER_ANGLE, 4)]);
      cashier.push([at, over(point, CASHIER_ANGLE)]);
      cashier.push([at + TAP_MS, over(point, CASHIER_ANGLE, 3)]);

      if (index < keys.length) {
        keyTaps.push({ at, key });
      }

      at += step;
    });

    const appAt = at + 0.04;
    const tile = appCentre(app);

    cashier.push([appAt - 0.02, over(tile, CASHIER_ANGLE, 5)]);
    cashier.push([appAt, over(tile, CASHIER_ANGLE)]);
    cashier.push([appAt + TAP_MS, over(tile, CASHIER_ANGLE, 4)]);
    cashier.push([appAt + 0.09, REST.cashier]);
    appTap = { at: appAt, app };
    timing = { ask: appAt + 0.035, reach: appAt + 0.13 };
  }

  const okAt = isFull ? keyTaps.length > 0 ? keyTaps[keyTaps.length - 1].at + 0.042 : 0.1 : 0;
  const screen: Array<Key<ScreenState>> = isFull
    ? [[0, "idle"], [0.085, "keying"], [okAt + 0.02, "apps"], [timing.ask, "ask"]]
    : [[0, "ask"]];
  const { reach } = timing;
  const [first, second] = ITEM_AT[gesture];
  const rest = ITEM_REST[gesture];
  const point: Array<Key<Pose>> = [[0, REST.point]];
  const pinTaps: number[] = [];
  let item: Array<Key<Pose>>;
  let gripFollows: Array<[number, number]>;
  let waves: Built["waves"] = null;
  let sweep: Built["sweep"] = null;
  let processing: number;
  let approved: number;

  if (gesture === "insert") {
    // Into the reader, then (in the full story) the PIN on the screen with the other hand, then out again.
    const inserted = reach + 0.04;

    if (isFull) {
      const pinFrom = inserted + 0.07;

      PIN_KEYS.forEach((_, index) => pinTaps.push(pinFrom + index * 0.034));

      const okTap = pinFrom + PIN_KEYS.length * 0.034;

      point.push([inserted + 0.01, REST.point]);
      PIN_KEYS.forEach((key, index) => {
        const at = pinTaps[index];
        const centre = keyCentre(key);

        point.push([at - 0.016, over(centre, POINT_ANGLE, -4)]);
        point.push([at, over(centre, POINT_ANGLE)]);
        point.push([at + TAP_MS, over(centre, POINT_ANGLE, -3)]);
      });
      point.push([okTap - 0.016, over(keyCentre(OK_KEY), POINT_ANGLE, -4)]);
      point.push([okTap, over(keyCentre(OK_KEY), POINT_ANGLE)]);
      point.push([okTap + 0.07, REST.point]);
      processing = okTap + 0.01;
      approved = okTap + 0.05;
      screen.push([inserted + 0.03, "pin"]);
    } else {
      processing = inserted + 0.04;
      approved = inserted + 0.14;
    }

    const out = approved + 0.05;

    item = [[0, rest], [timing.ask, rest], [reach, first], [inserted, second], [out, second], [out + 0.05, first], [Math.min(out + 0.16, 1), rest]];
    // The hand lets go once the card is in, and comes back for it once the payment is approved.
    gripFollows = isFull ? [[0, inserted + 0.005], [out - 0.04, 1]] : [[0, 1]];
  } else if (gesture === "swipe") {
    const swiped = reach + 0.05;

    item = [[0, rest], [timing.ask, rest], [reach, first], [swiped, second], [Math.min(swiped + 0.14, 1), { x: 250, y: 270, angle: 0.3 }]];
    gripFollows = [[0, 1]];
    processing = swiped + 0.01;
    approved = swiped + (isFull ? 0.07 : 0.16);
  } else {
    // Held to the terminal a moment: pressed in for a tap or a wallet, still while a phone reads the QR code.
    const hold = isFull ? 0.1 : 0.14;
    const press = reach + hold * 0.35;
    const leave = reach + hold;

    item = [[0, rest], [timing.ask, rest], [reach, first], [press, second], [leave, first], [Math.min(leave + 0.16, 1), rest]];
    gripFollows = [[0, 1]];

    if (gesture === "scan") {
      sweep = [reach, leave];
    } else {
      waves = [reach, leave];
    }

    processing = leave - hold * 0.25;
    approved = leave + (isFull ? 0.04 : 0.06);
  }

  screen.push([processing, "processing"], [approved, "approved"]);
  screen.sort((one, two) => one[0] - two[0]);

  return {
    cashier: [...cashier, [1, REST.cashier]],
    point: [...point, [1, REST.point]],
    item,
    gripFollows,
    screen,
    keyTaps,
    appTap,
    pinTaps,
    waves,
    sweep,
    approved,
    printed: [approved + 0.02, Math.min(approved + (isFull ? 0.12 : 0.24), 1)],
  };
};

const cache = new Map<string, Built>();

const storyOf = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): Built => {
  const key = `${variant}:${gesture}:${app}:${keys.join(",")}`;
  const made = cache.get(key) ?? build(variant, gesture, app, keys);

  cache.set(key, made);

  return made;
};

// The share of the story at which the payment is approved, for the page to say so at that moment.
export const approvedAt = (variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): number =>
  storyOf(variant, gesture, app, keys).approved;

const stateAt = (keys: Array<Key<ScreenState>>, t: number): ScreenState =>
  keys.reduce((state, [at, next]) => (t >= at ? next : state), keys[0][1]);

const isOffScene = (pose: Pose) => pose.x < -60 || pose.x > 360 || pose.y < -60 || pose.y > 270;

// The scene at a moment of the story (null for waiting, before or after a payment).
export const checkoutAt = (t: number | null, variant: CheckoutVariant, gesture: CheckoutGesture, app: number, keys: number[]): CheckoutFrame => {
  const story = storyOf(variant, gesture, app, keys);

  if (t === null) {
    return {
      cashier: null,
      customerGrip: null,
      customerPoint: null,
      item: null,
      isItemBehind: false,
      screen: { state: variant === "full" ? "idle" : "ask", typed: 0, pin: 0, pressed: null, spinner: 0 },
      waves: 0,
      sweep: 0,
      receipt: 0,
    };
  }

  const item = poseAt(story.item, t);
  const grip = mixPose(REST.grip, gripOf(gesture, item), holdOf(story.gripFollows, t));
  const cashier = poseAt(story.cashier, t);
  const point = poseAt(story.point, t);
  const state = stateAt(story.screen, t);
  const keyPressed = story.keyTaps.find(({ at }) => within(t, at, at + TAP_MS));
  const pinPressed = story.pinTaps.findIndex((at) => within(t, at, at + TAP_MS));
  const isAppPressed = story.appTap !== null && within(t, story.appTap.at, story.appTap.at + TAP_MS);
  // A card going into a reader passes behind the terminal's body.
  const isBehind = gesture === "insert" || gesture === "swipe";
  const span = (range: [number, number] | null) => (range && t >= range[0] && t < range[1] ? (t - range[0]) / (range[1] - range[0]) : 0);
  const processingFrom = story.screen.find(([, next]) => next === "processing")?.[0] ?? story.approved;

  return {
    cashier: isOffScene(cashier) ? null : cashier,
    customerGrip: isOffScene(grip) ? null : grip,
    customerPoint: isOffScene(point) ? null : point,
    item: isOffScene(item) ? null : item,
    isItemBehind: isBehind,
    screen: {
      state,
      typed: story.keyTaps.filter(({ at }) => t >= at).length,
      pin: story.pinTaps.filter((at) => t >= at).length,
      pressed: keyPressed ? keyPressed.key : pinPressed >= 0 ? PIN_KEYS[pinPressed] : isAppPressed ? story.appTap?.app ?? null : null,
      spinner: state === "processing" ? (t - processingFrom) / Math.max(story.approved - processingFrom, 1e-6) : 0,
    },
    waves: story.waves ? Math.sin(Math.PI * span(story.waves)) : 0,
    sweep: span(story.sweep),
    receipt: span(story.printed) || (t >= story.printed[1] ? 1 : 0),
  };
};

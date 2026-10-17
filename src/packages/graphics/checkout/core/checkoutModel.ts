import type { RigChannels, RigModel, RigMotion } from "@/packages/graphics/rig";

import { CheckoutFrame, CheckoutSkin, CheckoutVariant, ScreenState } from "../domain/types";
import {
  paintBody, paintCard, paintCounter, paintGlass, paintGrippingHand, paintPhone, paintPointingHand, paintReceipt, paintScreen, paintStand,
  paintSweep, paintWaves,
} from "./CheckoutPainter";
import { BODY, keysFor, SCENE } from "./geometry";
import { checkoutAt } from "./story";

const STATES: ScreenState[] = ["idle", "keying", "apps", "ask", "pin", "processing", "approved"];

// Far off the scene, where a layer waits while it is not in the story.
const AWAY: RigMotion = { x: -2000, y: -2000 };

// The room each moving part is cached in, around its own origin.
const ITEM_BOUNDS = { x: -46, y: -46, width: 92, height: 92 };
const POINTING_BOUNDS = { x: -124, y: -26, width: 132, height: 52 };
const GRIPPING_BOUNDS = { x: -16, y: -32, width: 118, height: 60 };

// The receipt is drawn printed out of the top, and pushed back into the printer until it prints.
const RECEIPT_TRAVEL = 34;

const PARTS = ["cashier", "grip", "point", "item"] as const;

const encode = (frame: CheckoutFrame): RigChannels => {
  const poses = { cashier: frame.cashier, grip: frame.customerGrip, point: frame.customerPoint, item: frame.item };
  const channels: RigChannels = {
    behind: frame.isItemBehind ? 1 : 0,
    screen: STATES.indexOf(frame.screen.state),
    typed: frame.screen.typed,
    pin: frame.screen.pin,
    pressed: frame.screen.pressed ?? -1,
    spinner: frame.screen.spinner,
    waves: frame.waves,
    sweep: frame.sweep,
    receipt: frame.receipt,
  };

  PARTS.forEach((part) => {
    const pose = poses[part];

    channels[`${part}On`] = pose ? 1 : 0;
    channels[`${part}X`] = pose?.x ?? 0;
    channels[`${part}Y`] = pose?.y ?? 0;
    channels[`${part}A`] = pose?.angle ?? 0;
  });

  return channels;
};

const motionOf = (channels: RigChannels, part: typeof PARTS[number]): RigMotion =>
  (channels[`${part}On`] ? { x: channels[`${part}X`], y: channels[`${part}Y`], rotate: channels[`${part}A`] } : AWAY);

// The checkout as a rig model for one way to pay: the counter, the stand and the terminal cached once; the screen,
// the contactless glow and a phone's scan line painted live; the receipt, what the customer holds and the hands
// cached once and moved by the story. "pay" plays a payment; "approved", held, shows one approved without moving.
export const createCheckoutModel = (skin: CheckoutSkin, variant: CheckoutVariant): RigModel<CheckoutSkin> => {
  const { gesture, app } = skin.look;
  const keys = keysFor(skin.amount);
  const isPhone = gesture === "wallet" || gesture === "scan";
  const paintItem = (context: Parameters<typeof paintCard>[0]) => (isPhone
    ? paintPhone(context, skin.look)
    : paintCard(context, skin.look, gesture === "insert" || gesture === "swipe"));

  return {
    id: `checkout-${variant}`,
    width: SCENE.width,
    height: SCENE.height,
    layers: [
      { id: "counter", paint: (context, dressed) => paintCounter(context, dressed.accent) },
      { id: "stand", paint: (context) => paintStand(context) },
      {
        id: "receipt",
        bounds: { x: 130, y: BODY.y - RECEIPT_TRAVEL - 4, width: 40, height: 56 },
        paint: (context) => paintReceipt(context),
        motion: (channels) => ({ y: RECEIPT_TRAVEL * (1 - channels.receipt) }),
      },
      {
        id: "item-behind",
        bounds: ITEM_BOUNDS,
        paint: (context) => paintItem(context),
        motion: (channels) => (channels.behind ? motionOf(channels, "item") : AWAY),
      },
      { id: "body", paint: (context, dressed) => paintBody(context, dressed.accent) },
      {
        id: "screen",
        cache: false,
        paint: (context, dressed, channels) => paintScreen(context, dressed, {
          state: STATES[channels.screen] ?? "idle",
          typed: channels.typed,
          pin: channels.pin,
          pressed: channels.pressed >= 0 ? channels.pressed : null,
          spinner: channels.spinner,
        }),
      },
      { id: "glass", paint: (context) => paintGlass(context) },
      { id: "waves", cache: false, paint: (context, dressed, channels) => paintWaves(context, dressed.accent, channels.waves) },
      {
        id: "item-front",
        bounds: ITEM_BOUNDS,
        paint: (context) => paintItem(context),
        motion: (channels) => (channels.behind ? AWAY : motionOf(channels, "item")),
      },
      {
        id: "sweep",
        cache: false,
        paint: (context, dressed, channels) => paintSweep(context, dressed.accent, channels.sweep),
        motion: (channels) => (isPhone ? motionOf(channels, "item") : AWAY),
      },
      { id: "grip", bounds: GRIPPING_BOUNDS, paint: (context) => paintGrippingHand(context, "customer"), motion: (channels) => motionOf(channels, "grip") },
      { id: "point", bounds: POINTING_BOUNDS, paint: (context) => paintPointingHand(context, "customer"), motion: (channels) => motionOf(channels, "point") },
      { id: "cashier", bounds: POINTING_BOUNDS, paint: (context) => paintPointingHand(context, "cashier"), motion: (channels) => motionOf(channels, "cashier") },
    ],
    channels: (_timeMs, cues) => {
      const isHeldApproved = cues.progress("approved") !== null;
      const progress = isHeldApproved ? 1 : cues.progress("pay");

      return encode(checkoutAt(progress, variant, gesture, app, keys));
    },
  };
};

import type { RigChannels, RigLayer, RigModel, RigMotion } from "@/packages/graphics/rig";
import { clamp01 } from "@/packages/math/clamp";

import { CheckoutFrame, CheckoutGesture, CheckoutSkin, CheckoutTrail, CheckoutVariant, Pose, ScreenState } from "../domain/types";
import {
  paintBody, paintCard, paintCounter, paintGlass, paintItemShadow, paintPhone, paintReceipt, paintScreen, paintStand, paintSweep, paintVignette,
  paintWaves,
} from "./CheckoutPainter";
import type { CheckoutStage } from "./checkoutStage";
import { BODY, COUNTER_TOP, keysFor, SCENE, SCREEN, STAND } from "./geometry";
import {
  GRIPPING_BOUNDS, GRIPPING_SHADOW_BOUNDS, paintGrippingHand, paintGrippingShadow, paintPointingHand, paintPointingShadow, POINTING_BOUNDS,
  POINTING_SHADOW_BOUNDS, widenForShadow,
} from "./hands";
import { CASHIER_ANGLE, checkoutAt, MAX_ZOOM, POINT_ANGLE } from "./story";

const STATES: ScreenState[] = ["idle", "keying", "apps", "ask", "pin", "processing", "approved"];

// Not drawn at all while it is not in the story.
const HIDDEN: RigMotion = { opacity: 0 };

// The room each moving part is cached in, around its own origin.
const ITEM_BOUNDS = { x: -46, y: -46, width: 92, height: 92 };

// The receipt is drawn printed out of the top, and pushed back into the printer until it prints.
const RECEIPT_TRAVEL = 34;

// The turn the holding hand is mostly drawn at for each way to pay, for its light.
const GRIP_ANGLE: Record<CheckoutGesture, number> = { tap: -0.05, wallet: 0.47, scan: 0.36, insert: 1.2, swipe: 1.2 };

const PARTS = ["cashier", "grip", "point", "item"] as const;

type Part = typeof PARTS[number];

const poseOf = (parts: CheckoutTrail, part: Part): Pose | null =>
  ({ cashier: parts.cashier, grip: parts.customerGrip, point: parts.customerPoint, item: parts.item })[part];

// How faint each step of a motion blur is at its strongest, nearest first.
const TRAIL_ALPHA = [0.34, 0.17];

// Below this many units a frame, nothing blurs; the blur is at its strongest this many further on.
const BLUR_FROM = 1.5;

const BLUR_RANGE = 8;

const encodePose = (channels: RigChannels, prefix: string, pose: Pose | null) => {
  channels[`${prefix}On`] = pose ? 1 : 0;
  channels[`${prefix}X`] = pose?.x ?? 0;
  channels[`${prefix}Y`] = pose?.y ?? 0;
  channels[`${prefix}A`] = pose?.angle ?? 0;
  channels[`${prefix}S`] = pose?.scale ?? 1;
};

const encode = (frame: CheckoutFrame): RigChannels => {
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
    cameraX: frame.camera.x,
    cameraY: frame.camera.y,
    cameraZoom: frame.camera.zoom,
  };

  PARTS.forEach((part) => {
    const pose = poseOf(frame, part);

    encodePose(channels, part, pose);
    frame.trail.forEach((past, index) => {
      const before = poseOf(past, part);
      const moved = pose && before ? Math.hypot(pose.x - before.x, pose.y - before.y) : 0;

      encodePose(channels, `${part}Trail${index}`, before);
      channels[`${part}Trail${index}Alpha`] = clamp01((moved - BLUR_FROM) / BLUR_RANGE) * TRAIL_ALPHA[index];
    });
  });

  return channels;
};

const motionOf = (channels: RigChannels, prefix: string): RigMotion =>
  (channels[`${prefix}On`]
    ? { x: channels[`${prefix}X`], y: channels[`${prefix}Y`], rotate: channels[`${prefix}A`], scale: channels[`${prefix}S`] }
    : HIDDEN);

// A step of a part's motion blur: where it was a frame or two ago, as faint as it moved fast.
const trailOf = (channels: RigChannels, part: Part, index: number): RigMotion => {
  const alpha = channels[`${part}Trail${index}Alpha`] ?? 0;

  return alpha > 0 ? { ...motionOf(channels, `${part}Trail${index}`), opacity: alpha } : HIDDEN;
};

// The shadow the top left light throws from a part down and to the right, further and fainter as it lifts.
const shadowOf = (channels: RigChannels, part: Part): RigMotion => {
  if (!channels[`${part}On`]) {
    return HIDDEN;
  }

  const lift = Math.max(0, channels[`${part}S`] - 0.98);

  return {
    x: channels[`${part}X`] + 2 + lift * 70,
    y: channels[`${part}Y`] + 3 + lift * 90,
    rotate: channels[`${part}A`],
    scale: channels[`${part}S`] * 1.02,
    opacity: clamp01(0.5 - lift * 2.4),
  };
};

// A moving part's layers: its motion blur, then itself, each step of the blur drawing the part's own frame.
const withTrail = (layer: RigLayer<CheckoutSkin>, part: Part, isShown: (channels: RigChannels) => boolean = () => true): Array<RigLayer<CheckoutSkin>> => [
  ...[1, 0].map((index) => ({
    id: `${layer.id}-trail-${index}`,
    cacheAs: layer.id,
    paint: (context: Parameters<RigLayer<CheckoutSkin>["paint"]>[0], dressed: CheckoutSkin, channels: RigChannels) => layer.paint(context, dressed, channels),
    motion: (channels: RigChannels) => (isShown(channels) ? trailOf(channels, part, index) : HIDDEN),
  })),
  layer,
];

// The checkout as a rig model for one way to pay: the counter, the stand and the terminal cached once; the screen
// and the contactless glow painted live; the hands and what the customer holds drawn by a 3D stage where there is one
// (real hands, a card in its finish, soft shadows), and otherwise flat: cached once and moved by the story, with their
// shadows and a blur behind whatever moves fast; the camera pushing in and following; and the lens's vignette over it
// all. "pay" plays a payment; "approved", held, shows one approved without moving.
export const createCheckoutModel = (skin: CheckoutSkin, variant: CheckoutVariant, stage: CheckoutStage | null = null): RigModel<CheckoutSkin> => {
  const { gesture, app } = skin.look;
  const keys = keysFor(skin.amount);
  const isPhone = gesture === "wallet" || gesture === "scan";
  const isUpright = gesture === "insert" || gesture === "swipe";
  const paintItem = (context: Parameters<typeof paintCard>[0]) => (isPhone ? paintPhone(context, skin.look) : paintCard(context, skin.look, isUpright));
  const isInFront = (channels: RigChannels) => channels.behind === 0;
  // The frame the channels were last read from, for the 3D stage to draw.
  let current: CheckoutFrame = checkoutAt(null, variant, gesture, app, keys);

  // Behind the terminal, a card going into a reader (the 3D stage hides it behind the terminal's body itself).
  const behind: Array<RigLayer<CheckoutSkin>> = stage ? [] : [
    {
      id: "item-behind",
      bounds: ITEM_BOUNDS,
      paint: (context) => paintItem(context),
      motion: (channels) => (isInFront(channels) ? HIDDEN : motionOf(channels, "item")),
    },
  ];
  // In front of it: the stage's hands and what they hold, or the flat ones with their shadows and blur.
  const front: Array<RigLayer<CheckoutSkin>> = stage
    ? [{ id: "stage", cache: false, isFixed: true, paint: (context) => stage.draw(context, current) }]
    : [
      {
        id: "item-shadow",
        bounds: widenForShadow(ITEM_BOUNDS),
        paint: (context) => paintItemShadow(context, isPhone, isUpright),
        motion: (channels) => (isInFront(channels) ? shadowOf(channels, "item") : HIDDEN),
      },
      { id: "grip-shadow", bounds: GRIPPING_SHADOW_BOUNDS, paint: (context) => paintGrippingShadow(context), motion: (channels) => shadowOf(channels, "grip") },
      { id: "cashier-shadow", bounds: POINTING_SHADOW_BOUNDS, paint: (context) => paintPointingShadow(context), motion: (channels) => shadowOf(channels, "cashier") },
      {
        id: "point-shadow",
        cacheAs: "cashier-shadow",
        paint: (context) => paintPointingShadow(context),
        motion: (channels) => shadowOf(channels, "point"),
      },
      ...withTrail({
        id: "item-front",
        bounds: ITEM_BOUNDS,
        paint: (context) => paintItem(context),
        motion: (channels) => (isInFront(channels) ? motionOf(channels, "item") : HIDDEN),
      }, "item", isInFront),
      {
        id: "sweep",
        cache: false,
        paint: (context, dressed, channels) => paintSweep(context, dressed.accent, channels.sweep),
        motion: (channels) => (isPhone ? motionOf(channels, "item") : HIDDEN),
      },
      ...withTrail({
        id: "grip",
        bounds: GRIPPING_BOUNDS,
        paint: (context) => paintGrippingHand(context, "customer", GRIP_ANGLE[gesture]),
        motion: (channels) => motionOf(channels, "grip"),
      }, "grip"),
      ...withTrail({
        id: "point",
        bounds: POINTING_BOUNDS,
        paint: (context) => paintPointingHand(context, "customer", POINT_ANGLE),
        motion: (channels) => motionOf(channels, "point"),
      }, "point"),
      ...withTrail({
        id: "cashier",
        bounds: POINTING_BOUNDS,
        paint: (context) => paintPointingHand(context, "cashier", CASHIER_ANGLE),
        motion: (channels) => motionOf(channels, "cashier"),
      }, "cashier"),
    ];

  return {
    id: `checkout-${variant}`,
    width: SCENE.width,
    height: SCENE.height,
    maxZoom: MAX_ZOOM,
    camera: (channels) => ({ x: channels.cameraX, y: channels.cameraY, zoom: channels.cameraZoom }),
    layers: [
      {
        id: "counter",
        bounds: { x: 0, y: COUNTER_TOP - 2, width: SCENE.width, height: SCENE.height - COUNTER_TOP + 2 },
        paint: (context, dressed) => paintCounter(context, dressed.accent),
      },
      {
        id: "stand",
        bounds: {
          x: STAND.foot.x - STAND.foot.rx - 16,
          y: BODY.y + BODY.height - 8,
          width: (STAND.foot.rx + 16) * 2,
          height: STAND.foot.y + STAND.foot.ry + 6 - (BODY.y + BODY.height - 8),
        },
        paint: (context) => paintStand(context),
      },
      {
        id: "receipt",
        bounds: { x: 130, y: BODY.y - RECEIPT_TRAVEL - 4, width: 40, height: 56 },
        paint: (context) => paintReceipt(context),
        motion: (channels) => ({ y: RECEIPT_TRAVEL * (1 - channels.receipt) }),
      },
      ...behind,
      {
        id: "body",
        bounds: { x: BODY.x - 22, y: BODY.y - 16, width: BODY.width + 44, height: BODY.height + 44 },
        paint: (context, dressed) => paintBody(context, dressed.accent),
      },
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
      { id: "glass", bounds: SCREEN, paint: (context) => paintGlass(context) },
      { id: "waves", cache: false, paint: (context, dressed, channels) => paintWaves(context, dressed.accent, channels.waves) },
      ...front,
      { id: "vignette", isFixed: true, paint: (context) => paintVignette(context) },
    ],
    channels: (_timeMs, cues) => {
      const isHeldApproved = cues.progress("approved") !== null;
      const progress = isHeldApproved ? 1 : cues.progress("pay");

      current = checkoutAt(progress, variant, gesture, app, keys);

      return encode(current);
    },
  };
};

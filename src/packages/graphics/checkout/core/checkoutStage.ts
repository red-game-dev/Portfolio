import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { createDrawableSurface } from "@/packages/graphics/canvas";
import { blendTurns, createHandPoser, HAND_MODELS, HAND_POSES, handSkeleton, handSockets, RIGHT_HAND } from "@/packages/graphics/hand";
import type { ActorPart, ActorSpec, ActorState, JointTurns, SceneHandle, Stage, StageFrame, StageScene } from "@/packages/graphics/stage3d";
import { attachBy, poseSkeleton, socketAt, socketBetween } from "@/packages/graphics/stage3d";
import { clamp01 } from "@/packages/math/clamp";
import { add, dot, fromAxisAngle, IDENTITY, multiply, normalize, Quat, rotate, scale, sub, Vec3, vec3 } from "@/packages/math/space";

import { CheckoutFrame, CheckoutSkin, Pose, ScreenState } from "../domain/types";
import { paintCardPicture } from "./cardFace";
import { paintPhone, paintSweep } from "./CheckoutPainter";
import { BODY, CARD, PHONE, SCENE } from "./geometry";

// The checkout on a 3D stage: the story's moments as actors. The cashier's and the customer's hands are the hand model
// in the pose they hold (pointing, or pinching a card or a phone), placed by their sockets: a fingertip's pad on the
// key it presses, pitched into the glass and lifted as the story lifts it; the pinch on what is held. What the customer
// holds is a real card in its issuer's finish or a phone with its screen, a little off the glass at the terminal and
// pressed nearer as it is read; going into a reader it passes behind the terminal, whose body hides it. The screen's
// glow lights the hands and brightens as the payment is approved. The 2D terminal is drawn under it all.

// The models the scene fills its slots with: the hand meshed pointing, pinching a card and pinching a phone.
export const CHECKOUT_MODELS = HAND_MODELS;

// Picture units per millimetre of the hand: a card is 60 units for its 85.6 millimetres.
const HAND_UNIT = 0.7;

// How far into the glass a pointing finger leans, and how far a lift in the story takes it off the glass.
const PITCH = 0.75;

const LIFT_PER_SCALE = 400;

// How far off the glass a card or phone is held at the terminal (contactless reads to about four centimetres) and how
// much nearer the story's press brings it; inside a reader it sits just behind the face.
const HELD = { at: 10, perScale: 700, behind: -4 } as const;

// The screen's glow for each of its states.
const GLOW: Record<ScreenState, number> = { idle: 160, keying: 200, apps: 200, ask: 240, pin: 220, processing: 300, approved: 480 };

const TOWARD_VIEWER = vec3(0, 0, 1);

const AWAY_Z = vec3(0, 0, -1);

const square = (forward: Vec3, up: Vec3) => normalize(sub(up, scale(forward, dot(forward, up))));

// A sleeve over the forearm, flattened to its oval, and its cuff at the wrist, in the hand's millimetres.
const ARM_OVAL = vec3(1, 1, 0.74);

const sleeve = (cloth: string, cuff: string): ActorPart[] => [
  {
    shape: { kind: "cylinder", radiusTop: 37, radiusBottom: 40, length: 380 },
    material: { kind: "cloth", colour: cloth },
    offset: vec3(0, -252, -2),
    scale: ARM_OVAL,
  },
  {
    shape: { kind: "cylinder", radiusTop: 38.5, radiusBottom: 38.5, length: 16 },
    material: { kind: "cloth", colour: cuff },
    offset: vec3(0, -66, -2),
    scale: ARM_OVAL,
  },
];

// The cashier's watch: its strap round the wrist and its steel case on the back of it.
const FACE_UP = fromAxisAngle(vec3(1, 0, 0), Math.PI / 2);

const WATCH: ActorPart[] = [
  {
    shape: { kind: "cylinder", radiusTop: 31.5, radiusBottom: 31.5, length: 18 },
    material: { kind: "matte", colour: "#1a1a1d", roughness: 0.5 },
    offset: vec3(0, -38, -2),
    scale: vec3(1, 1, 0.68),
  },
  {
    shape: { kind: "cylinder", radiusTop: 18, radiusBottom: 18, length: 9 },
    material: { kind: "metal", colour: "#c9ccd3", roughness: 0.18 },
    offset: vec3(0, -38, 21),
    turn: FACE_UP,
  },
  {
    shape: { kind: "cylinder", radiusTop: 15, radiusBottom: 15, length: 9.4 },
    material: { kind: "matte", colour: "#0b0d12", roughness: 0.25 },
    offset: vec3(0, -38, 21.2),
    turn: FACE_UP,
  },
];

const CLOTH = { cashier: ["#2d3653", "#3a4566"], customer: ["#5d4c3b", "#6e5c48"] } as const;

const handActor = (id: string, model: string, who: keyof typeof CLOTH, extra: ActorPart[] = []): ActorSpec => ({
  id,
  unit: HAND_UNIT,
  castsShadow: true,
  parts: [{ shape: { kind: "model", model } }, ...sleeve(CLOTH[who][0], CLOTH[who][1]), ...extra],
});

const pictureOf = (kind: "card" | "phone", skin: CheckoutSkin) => `${kind}:${skin.id}`;

export const checkoutScene = (skin: CheckoutSkin): StageScene => {
  const isPhone = skin.look.gesture === "wallet" || skin.look.gesture === "scan";

  return {
    actors: [
      handActor("cashier", CHECKOUT_MODELS.point, "cashier", WATCH),
      handActor("pin", CHECKOUT_MODELS.point, "customer"),
      handActor("grip", isPhone ? CHECKOUT_MODELS.phone : CHECKOUT_MODELS.card, "customer"),
      {
        id: "card",
        castsShadow: true,
        parts: [{
          shape: { kind: "plate", width: CARD.long, height: CARD.short, depth: 0.76, radius: CARD.radius },
          material: { kind: "picture", picture: pictureOf("card", skin), finish: skin.look.card?.finish ?? "gloss" },
        }],
      },
      {
        id: "phone",
        castsShadow: true,
        parts: [{
          shape: { kind: "plate", width: PHONE.width, height: PHONE.height, depth: 7.6, radius: PHONE.radius },
          material: { kind: "picture", picture: pictureOf("phone", skin), finish: "gloss" },
        }],
      },
      // The terminal's body, hiding what goes into its readers.
      {
        id: "reader",
        isOccluder: true,
        parts: [{ shape: { kind: "box", width: BODY.width, height: BODY.height, depth: 24 }, offset: vec3(BODY.x + BODY.width / 2, -(BODY.y + BODY.height / 2), -12) }],
      },
    ],
    lights: [
      { id: "ambient", kind: "ambient", colour: "#dfe6ff", intensity: 0.45 },
      { id: "key", kind: "key", colour: "#fff1e2", intensity: 2.3, position: vec3(-120, 160, 260), castsShadow: true },
      { id: "rim", kind: "rim", colour: "#bfe4ff", intensity: 1.4, position: vec3(260, -40, -90) },
      { id: "glow", kind: "glow", colour: skin.accent, intensity: GLOW.idle, position: vec3(150, -76, 6), reach: 90 },
    ],
    shadow: { opacity: 0.42 },
  };
};

const HIDDEN = (id: string): ActorState => ({ id, isShown: false, position: vec3(), rotation: IDENTITY });

// How what the customer holds is pinched: a card near its top right corner (on its side going into a reader, by its
// lower end), a phone by its right edge, the thumb behind and the index fingertip over the front.
const PINCH = {
  card: { at: vec3(21, 13, 0), forward: vec3(-1, -0.35, 0) },
  upright: { at: vec3(-20, 6, 0), forward: vec3(1, 0.3, 0) },
  phone: { at: vec3(12, -14, 0), forward: vec3(-1, 0.3, 0) },
} as const;

// Where a hand that has let go of what it holds goes, at full let go: down, to the right and off the glass.
const LET_GO = vec3(40, -40, 30);

export interface CheckoutStageMap {
  scene: StageScene;
  frameOf(frame: CheckoutFrame): StageFrame;
}

export const checkoutStageMap = (skin: CheckoutSkin): CheckoutStageMap => {
  const skeleton = handSkeleton(RIGHT_HAND);
  const poser = createHandPoser(RIGHT_HAND, skeleton);
  const sockets = handSockets(RIGHT_HAND, skeleton);
  const turnsOf = (name: keyof typeof HAND_POSES) => poser.turnsOf(HAND_POSES[name]);
  const point = turnsOf("point");
  const press = turnsOf("press");
  const { gesture } = skin.look;
  const isPhone = gesture === "wallet" || gesture === "scan";
  const isUpright = gesture === "insert" || gesture === "swipe";
  const pinchTurns = isPhone ? turnsOf("phone") : turnsOf("card");
  const pinchPosed = poseSkeleton(skeleton, pinchTurns);
  const pinch = socketBetween(socketAt(pinchPosed, sockets["thumb-pad"]), socketAt(pinchPosed, sockets["index-pad"]));

  const pointing = (id: string, pose: Pose | null): ActorState => {
    if (!pose) {
      return HIDDEN(id);
    }

    const pressing = clamp01((1.035 - pose.scale) / 0.05);
    const joints: JointTurns = blendTurns(point, press, pressing);
    const socket = socketAt(poseSkeleton(skeleton, joints), sockets["index-pad"]);
    const along = vec3(Math.cos(pose.angle), -Math.sin(pose.angle), 0);
    const forward = normalize(add(scale(along, Math.cos(PITCH)), scale(AWAY_Z, Math.sin(PITCH))));
    const lift = 1.5 + Math.max(0, pose.scale - 0.985) * LIFT_PER_SCALE;

    return { id, isShown: true, ...attachBy(socket, HAND_UNIT, { position: vec3(pose.x, -pose.y, lift), forward, up: square(forward, TOWARD_VIEWER) }), joints };
  };

  const held = (frame: CheckoutFrame): ActorState[] => {
    const item = frame.item;

    if (!item) {
      return [HIDDEN("card"), HIDDEN("phone"), HIDDEN("grip")];
    }

    const flat = fromAxisAngle(TOWARD_VIEWER, -item.angle);
    const rotation: Quat = isUpright ? multiply(flat, fromAxisAngle(TOWARD_VIEWER, Math.PI / 2)) : flat;
    const depth = frame.isItemBehind ? HELD.behind : HELD.at + Math.max(0, item.scale - 0.99) * HELD.perScale;
    const centre = vec3(item.x, -item.y, depth);
    const thing: ActorState = { id: isPhone ? "phone" : "card", isShown: true, position: centre, rotation };
    const other = HIDDEN(isPhone ? "card" : "phone");

    if (!frame.customerGrip) {
      return [thing, other, HIDDEN("grip")];
    }

    const way = isPhone ? PINCH.phone : isUpright ? PINCH.upright : PINCH.card;
    const target = {
      position: add(centre, rotate(rotation, way.at)),
      forward: rotate(rotation, way.forward),
      up: rotate(rotation, AWAY_Z),
    };
    const placed = attachBy(pinch, HAND_UNIT, target);
    const away = scale(LET_GO, 1 - frame.hold);

    return [thing, other, { id: "grip", isShown: true, position: add(placed.position, away), rotation: placed.rotation, joints: pinchTurns }];
  };

  return {
    scene: checkoutScene(skin),
    frameOf: (frame) => ({
      view: { width: SCENE.width, height: SCENE.height, centre: { x: frame.camera.x, y: frame.camera.y }, zoom: frame.camera.zoom, fov: 30 },
      actors: [
        pointing("cashier", frame.cashier),
        pointing("pin", frame.customerPoint),
        ...held(frame),
        { id: "reader", isShown: true, position: vec3(), rotation: IDENTITY },
      ],
      lights: { glow: { intensity: GLOW[frame.screen.state] } },
    }),
  };
};

// The pictures a skin's card and phone show, at the size the stage draws them.
const PHONE_PICTURE_SCALE = 8;

const phonePicture = (skin: CheckoutSkin, sweep: number) => {
  const surface = createDrawableSurface(PHONE.width * PHONE_PICTURE_SCALE, PHONE.height * PHONE_PICTURE_SCALE);

  if (!surface) {
    return null;
  }

  surface.context.scale(PHONE_PICTURE_SCALE, PHONE_PICTURE_SCALE);
  surface.context.translate(PHONE.width / 2, PHONE.height / 2);
  paintPhone(surface.context, skin.look);

  if (sweep > 0) {
    paintSweep(surface.context, skin.accent, sweep);
  }

  return surface.surface;
};

// What draws the 3D part of the checkout into its canvas: the hands, and what the customer holds.
export interface CheckoutStage {
  draw(context: Canvas2DContext, frame: CheckoutFrame): void;
  release(): void;
}

// Sets the checkout's scene up on a stage and hands back what draws it each frame.
export const bindCheckoutStage = async (stage: Stage, skin: CheckoutSkin): Promise<CheckoutStage> => {
  const map = checkoutStageMap(skin);
  const card = skin.look.card ? paintCardPicture(skin.look, skin.look.card) : null;
  let sweepShown = -1;

  if (card) {
    stage.setPicture(pictureOf("card", skin), card, 1);
  }

  const handle: SceneHandle = await stage.mount(map.scene);

  return {
    draw: (context, frame) => {
      // A phone's camera sweep is part of its screen, painted again as it moves.
      const sweep = Math.round(frame.sweep * 40) / 40;

      if (sweep !== sweepShown && (skin.look.gesture === "scan" || skin.look.gesture === "wallet")) {
        const picture = phonePicture(skin, sweep);

        if (picture) {
          stage.setPicture(pictureOf("phone", skin), picture, sweep);
        }

        sweepShown = sweep;
      }

      stage.draw(handle, map.frameOf(frame), context, { x: 0, y: 0, width: SCENE.width, height: SCENE.height });
    },
    release: () => stage.unmount(handle),
  };
};

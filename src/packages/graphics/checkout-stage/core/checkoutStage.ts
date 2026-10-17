import { createDrawableSurface } from "@/packages/graphics/canvas";
import { CHECKOUT_LAYOUT, paintCardPicture, paintPhone, paintSweep } from "@/packages/graphics/checkout";
import type { CheckoutFrame, CheckoutSkin, CheckoutStage, Pose, ScreenState } from "@/packages/graphics/checkout";
import {
  blendTurns, createHandPoser, gripSocket, HAND_GRIPS, HAND_MODELS, HAND_POSES, handField, handSkeleton, handSockets, RIGHT_HAND,
} from "@/packages/graphics/hand";
import type { HandGrip } from "@/packages/graphics/hand";
import { keepCamera } from "@/packages/graphics/rig";
import type { ActorPart, ActorSpec, ActorState, Finish, JointTurns, SceneHandle, Stage, StageFrame, StageScene } from "@/packages/graphics/stage3d";
import { attachBy, poseSkeleton, socketAt } from "@/packages/graphics/stage3d";
import { clamp01 } from "@/packages/math/clamp";
import { add, conjugate, dot, fromAxisAngle, IDENTITY, multiply, normalize, Quat, rotate, scale, sub, Vec3, vec3 } from "@/packages/math/space";

// The checkout on a 3D stage: the story's moments as actors. The cashier's and the customer's hands are the hand model
// in the pose they hold (pointing, or holding a card or a phone), placed by their sockets: a fingertip's pad on the
// key it presses, pitched into the glass and lifted as the story lifts it; the grip on what is held, found so that no
// flesh passes into it. What the customer
// holds is a real card in its issuer's finish or a phone with its screen, held off the glass far enough that the hand
// holding it never passes behind the terminal's face, and pressed nearer as it is read; going into a reader, the end
// inside the terminal's body is cut away. The screen's glow lights the hands and brightens as the payment is approved.
// The 2D terminal is drawn under it all.

// The models the scene fills its slots with: the hand meshed pointing, holding a card and holding a phone, and the
// customer who pays by face, a scanned head and shoulders the host registers from a file.
export const CUSTOMER_MODEL = "head.customer";

export const CHECKOUT_MODELS = { ...HAND_MODELS, customer: CUSTOMER_MODEL } as const;

// Picture units per millimetre of the hand: a card is 60 units for its 85.6 millimetres.
const HAND_UNIT = 0.7;

// How far into the glass a pointing finger leans, in radians: the least from these at which its fingertip is what
// touches, the curled fingers behind it clear of the glass by `clear` millimetres, as a real hand tilts to tap a
// screen. How far the fingertip on a key is off the glass, and how far a lift in the story takes it off.
const PITCH = { least: 0.75, most: 1.45, step: 0.05, clear: 3 } as const;

const LIFT = { at: 1.5, perScale: 400 } as const;

// How far off the glass a card or phone is held at the terminal at least (contactless reads to about four centimetres),
// how much nearer the story's press brings it, and how far the hand that holds it stays in front of the glass.
const HELD = { at: 10, perScale: 700, clearance: 2 } as const;

// The screen's glow for each of its states.
const GLOW: Record<ScreenState, number> = { idle: 160, keying: 200, apps: 200, ask: 240, pin: 220, face: 280, processing: 300, approved: 480 };

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

// The customer paying by face: their head and shoulders to the right of the terminal and a step back from it, turned to
// look into its camera, so their face is seen as it is read. The scan's middle (about the base of the neck) at the
// origin, in millimetres.
const CUSTOMER = { position: vec3(300, -150, -380), turn: fromAxisAngle(vec3(0, 1, 0), -0.95) } as const;

const customerActor = (): ActorSpec => ({
  id: "customer",
  unit: HAND_UNIT,
  castsShadow: true,
  parts: [{ shape: { kind: "model", model: CUSTOMER_MODEL } }],
});

const handActor = (id: string, model: string, who: keyof typeof CLOTH, extra: ActorPart[] = []): ActorSpec => ({
  id,
  unit: HAND_UNIT,
  castsShadow: true,
  parts: [{ shape: { kind: "model", model } }, ...sleeve(CLOTH[who][0], CLOTH[who][1]), ...extra],
});

const pictureOf = (kind: "card" | "phone", skin: CheckoutSkin) => `${kind}:${skin.id}`;

const isPhoneGesture = (gesture: CheckoutSkin["look"]["gesture"]) => gesture === "wallet" || gesture === "scan";

// A card going into a reader: pushed up into the chip reader at the foot, or swiped down the stripe at the side.
const isReaderGesture = (gesture: CheckoutSkin["look"]["gesture"]) => gesture === "insert" || gesture === "swipe";

export const checkoutScene = (skin: CheckoutSkin): StageScene => {
  const isPhone = isPhoneGesture(skin.look.gesture);

  return {
    actors: [
      ...(skin.look.gesture === "face" ? [customerActor()] : []),
      handActor("cashier", CHECKOUT_MODELS.point, "cashier", WATCH),
      handActor("pin", CHECKOUT_MODELS.point, "customer"),
      handActor("grip", isPhone ? CHECKOUT_MODELS.phone : CHECKOUT_MODELS.card, "customer"),
      {
        id: "card",
        castsShadow: true,
        // Its end inside the terminal's body, where a reader takes it, is not drawn.
        ...(isReaderGesture(skin.look.gesture) ? { hiddenInside: { x: BODY.x, y: BODY.y, width: BODY.width, height: BODY.height } } : {}),
        parts: [{
          shape: { kind: "plate", width: CARD.long, height: CARD.short, depth: 0.76, radius: CARD.radius },
          material: { kind: "picture", picture: pictureOf("card", skin), finish: skin.look.card?.finish ?? "gloss" },
        }],
      },
      {
        id: "phone",
        castsShadow: true,
        parts: [{
          shape: { kind: "plate", width: PHONE.width, height: PHONE.height, depth: PHONE.depth, radius: PHONE.radius },
          material: { kind: "picture", picture: pictureOf("phone", skin), finish: "gloss" },
        }],
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

// The grip the customer's hand holds each thing in, each found so that no flesh passes into it: a card held to the
// screen by its corner; a card going into a reader (up into the chip reader, down the stripe) by its lower end, the arm
// below and to the right; a phone from the bottom, its top left clear for the camera and NFC.
const gripOf = (gesture: CheckoutSkin["look"]["gesture"]): HandGrip => {
  if (isPhoneGesture(gesture)) {
    return HAND_GRIPS.phone;
  }

  return isReaderGesture(gesture) ? HAND_GRIPS.cardEnd : HAND_GRIPS.card;
};

// A held thing's own x axis.
const ALONG = vec3(1, 0, 0);

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
  const isPhone = isPhoneGesture(gesture);
  const isUpright = isReaderGesture(gesture);
  const grip = gripOf(gesture);
  const gripTurns = poser.turnsOf(grip.pose);
  const hold = socketAt(poseSkeleton(skeleton, gripTurns), gripSocket(grip));
  const upright = isUpright ? fromAxisAngle(TOWARD_VIEWER, Math.PI / 2) : IDENTITY;
  // The hand stood so its grip meets what it holds, held at `centre` and turned by `rotation`: the thing's own x axis
  // forward and its face, towards the viewer, up.
  const gripOn = (centre: Vec3, rotation: Quat) => attachBy(hold, HAND_UNIT, {
    position: centre,
    forward: rotate(rotation, ALONG),
    up: rotate(rotation, TOWARD_VIEWER),
  });
  // How far the holding hand reaches behind the middle of what it holds. A turn in the picture's plane changes
  // nothing, so it is worked out once, from the hand's flesh in that pose: what it holds is never nearer the glass than
  // that, so the fingers behind it never go into the terminal.
  const atRest = gripOn(vec3(), upright);
  const behind = HAND_UNIT * handField(RIGHT_HAND, gripTurns).reach(rotate(conjugate(atRest.rotation), AWAY_Z)) - atRest.position.z;
  const nearest = Math.max(HELD.at, behind + HELD.clearance);

  // The two held poses worked out once; only a press partway between them is blended each frame.
  const pointSocket = socketAt(poseSkeleton(skeleton, point), sockets["index-pad"]);
  const pressSocket = socketAt(poseSkeleton(skeleton, press), sockets["index-pad"]);
  const leanOf = (pitch: number, along: Vec3) => normalize(add(scale(along, Math.cos(pitch)), scale(AWAY_Z, Math.sin(pitch))));
  const pointers = ([[pointSocket, point], [pressSocket, press]] as const).map(([socket, joints]) => ({ socket, field: handField(RIGHT_HAND, joints) }));
  // A hand leaning so with its fingertip's pad at the glass: how far its index finger and the rest of it reach below
  // the pad (a turn in the picture's plane changes neither).
  const below = ({ socket, field }: (typeof pointers)[number], pitch: number) => {
    const forward = leanOf(pitch, vec3(1, 0, 0));
    const placed = attachBy(socket, HAND_UNIT, { position: vec3(), forward, up: square(forward, TOWARD_VIEWER) });
    const towardsGlass = rotate(conjugate(placed.rotation), AWAY_Z);

    return {
      index: HAND_UNIT * field.reach(towardsGlass, ["index"]) - placed.position.z,
      rest: HAND_UNIT * field.reach(towardsGlass, ["arm", "palm", "thumb", "middle", "ring", "pinky"]) - placed.position.z,
    };
  };
  let pitch: number = PITCH.least;

  while (pitch < PITCH.most && !pointers.every((hand) => {
    const { index, rest } = below(hand, pitch);

    return index >= rest + PITCH.clear * HAND_UNIT;
  })) {
    pitch += PITCH.step;
  }

  // How far below the pad the hand reaches, pointing and pressing, so its nearest point is the one put at the glass.
  const [pointBelow, pressBelow] = pointers.map((hand) => {
    const { index, rest } = below(hand, pitch);

    return Math.max(index, rest);
  });

  const fingertipOf = (pressing: number): { joints: JointTurns; socket: typeof pointSocket } => {
    if (pressing <= 0) {
      return { joints: point, socket: pointSocket };
    }

    if (pressing >= 1) {
      return { joints: press, socket: pressSocket };
    }

    const joints = blendTurns(point, press, pressing);

    return { joints, socket: socketAt(poseSkeleton(skeleton, joints), sockets["index-pad"]) };
  };

  const pointing = (id: string, pose: Pose | null): ActorState => {
    if (!pose) {
      return HIDDEN(id);
    }

    const pressing = clamp01((1.035 - pose.scale) / 0.05);
    const { joints, socket } = fingertipOf(pressing);
    const along = vec3(Math.cos(pose.angle), -Math.sin(pose.angle), 0);
    const forward = leanOf(pitch, along);
    const lift = LIFT.at + Math.max(0, pose.scale - 0.985) * LIFT.perScale + pointBelow + (pressBelow - pointBelow) * pressing;

    return { id, isShown: true, ...attachBy(socket, HAND_UNIT, { position: vec3(pose.x, -pose.y, lift), forward, up: square(forward, TOWARD_VIEWER) }), joints };
  };

  const held = (frame: CheckoutFrame): ActorState[] => {
    const item = frame.item;

    if (!item) {
      return [HIDDEN("card"), HIDDEN("phone"), HIDDEN("grip")];
    }

    const rotation: Quat = multiply(fromAxisAngle(TOWARD_VIEWER, -item.angle), upright);
    const depth = nearest + Math.max(0, item.scale - 0.99) * HELD.perScale;
    const centre = vec3(item.x, -item.y, depth);
    const thing: ActorState = { id: isPhone ? "phone" : "card", isShown: true, position: centre, rotation };
    const other = HIDDEN(isPhone ? "card" : "phone");

    if (!frame.customerGrip) {
      return [thing, other, HIDDEN("grip")];
    }

    const placed = gripOn(centre, rotation);
    const away = scale(LET_GO, 1 - frame.hold);

    return [thing, other, { id: "grip", isShown: true, position: add(placed.position, away), rotation: placed.rotation, joints: gripTurns }];
  };

  // The customer at the counter while a payment is under way, their face read while the screen scans it.
  const customerAt = (frame: CheckoutFrame): ActorState => ({
    id: "customer",
    isShown: frame.screen.state !== "idle",
    position: CUSTOMER.position,
    rotation: CUSTOMER.turn,
    ...(frame.screen.state === "face" ? { scan: { progress: frame.sweep, colour: skin.accent } } : {}),
  });

  return {
    scene: checkoutScene(skin),
    frameOf: (frame) => {
      // The camera as the 2D drawing keeps it (never past the scene's edges), so the 3D lands where the 2D does.
      const camera = keepCamera(frame.camera, SCENE.width, SCENE.height);

      return {
        view: { width: SCENE.width, height: SCENE.height, centre: { x: camera.x, y: camera.y }, zoom: camera.zoom, fov: 30 },
        actors: [
          pointing("cashier", frame.cashier),
          pointing("pin", frame.customerPoint),
          ...held(frame),
          ...(gesture === "face" ? [customerAt(frame)] : []),
        ],
        lights: { glow: { intensity: GLOW[frame.screen.state] } },
      };
    },
  };
};

const { body: BODY, card: CARD, phone: PHONE, scene: SCENE } = CHECKOUT_LAYOUT;

// The pictures a skin's card and phone show, at the size the stage draws them.
const PHONE_PICTURE_SCALE = 8;

// A phone's screen, painted again into the same surface as its camera sweeps.
const phonePainter = (skin: CheckoutSkin) => {
  const width = PHONE.width * PHONE_PICTURE_SCALE;
  const height = PHONE.height * PHONE_PICTURE_SCALE;
  const surface = createDrawableSurface(width, height);

  return (sweep: number) => {
    if (!surface) {
      return null;
    }

    const { context } = surface;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.setTransform(PHONE_PICTURE_SCALE, 0, 0, PHONE_PICTURE_SCALE, (PHONE.width / 2) * PHONE_PICTURE_SCALE, (PHONE.height / 2) * PHONE_PICTURE_SCALE);
    paintPhone(context, skin.look);

    if (sweep > 0) {
      paintSweep(context, skin.accent, sweep);
    }

    return surface.surface;
  };
};

// Each card's face once painted, by its skin and whether it prints the portrait, so a payment never waits to paint it
// again.
const cardPictures = new Map<string, ReturnType<typeof paintCardPicture>>();

const cardPictureOf = (skin: CheckoutSkin) => {
  const key = `${skin.id}:${skin.look.portrait ? "portrait" : "plain"}`;

  if (!cardPictures.has(key)) {
    cardPictures.set(key, skin.look.card ? paintCardPicture(skin.look, skin.look.card) : null);
  }

  return cardPictures.get(key) ?? null;
};

const FINISHES: Finish[] = ["metal", "gloss", "matte", "frosted"];

// Every material a payment's scene can hold, with the same lights: the hands, a card in each finish (as it is held
// and as a reader cuts it) and a phone.
const warmScene = (): StageScene => {
  const look: CheckoutSkin["look"] = { gesture: "tap", app: 0, face: ["#000000", "#000000"], mark: { width: 1, height: 1, parts: [] } };
  const base = checkoutScene({ id: "warm", look, amount: "", accent: "#ffffff" });
  const cards = FINISHES.flatMap((finish) => [false, true].map((isCut): ActorSpec => ({
    id: `card-${finish}-${isCut ? "cut" : "whole"}`,
    castsShadow: true,
    ...(isCut ? { hiddenInside: { x: BODY.x, y: BODY.y, width: BODY.width, height: BODY.height } } : {}),
    parts: [{ shape: { kind: "plate", width: CARD.long, height: CARD.short, depth: 0.76, radius: CARD.radius }, material: { kind: "picture", picture: "warm", finish } }],
  })));

  return { ...base, actors: [...base.actors.filter((actor) => actor.id !== "card"), ...cards, customerActor()] };
};

const warmed = new WeakSet<Stage>();

// Sets every material the counter can show up on the stage once and keeps it there, never drawn, so their shaders are
// compiled and stay compiled: a payment's own scene then compiles nothing and is ready at once.
export const warmCheckoutStage = async (stage: Stage): Promise<void> => {
  if (warmed.has(stage)) {
    return;
  }

  warmed.add(stage);
  await stage.mount(warmScene());
};

// Sets the checkout's scene up on a stage and hands back what draws it each frame.
export const bindCheckoutStage = async (stage: Stage, skin: CheckoutSkin): Promise<CheckoutStage> => {
  const map = checkoutStageMap(skin);
  const card = cardPictureOf(skin);
  const isPhone = skin.look.gesture === "scan" || skin.look.gesture === "wallet";
  const paintScreen = isPhone ? phonePainter(skin) : null;
  let sweepShown = -1;

  if (card) {
    stage.setPicture(pictureOf("card", skin), card, 1);
  }

  const handle: SceneHandle = await stage.mount(map.scene);
  const box = { x: 0, y: 0, width: SCENE.width, height: SCENE.height };

  return {
    draw: (context, frame) => {
      // A phone's camera sweep is part of its screen, painted again as it moves.
      const sweep = Math.round(frame.sweep * 40) / 40;

      if (paintScreen && sweep !== sweepShown) {
        const picture = paintScreen(sweep);

        if (picture) {
          stage.setPicture(pictureOf("phone", skin), picture, sweep);
        }

        sweepShown = sweep;
      }

      // The stage fills the whole canvas, so it draws at the canvas's own size.
      stage.draw(handle, map.frameOf(frame), context, box, { width: context.canvas.width, height: context.canvas.height });
    },
    quality: () => stage.quality,
    setQuality: (level) => stage.setQuality(level),
    onLost: (listener) => stage.onLost(listener),
    release: () => stage.unmount(handle),
  };
};

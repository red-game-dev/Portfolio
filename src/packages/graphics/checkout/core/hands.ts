import { Canvas2DContext, createDrawableSurface } from "@/packages/graphics/canvas";

// The two hands of the checkout, painted as near to real as a canvas allows, at the scene's units around a fixed
// origin so the rig caches each once and only moves it: a pointing hand keying on the screen (the cashier's, or the
// customer's for a PIN) and a hand holding a card or a phone. Every part is shaded as the rounded thing it is, lit
// from the scene's top left (turned into the hand's own frame by the angle it is mostly drawn at), with warmer edges
// where light passes through skin, creases at the joints, nails with their shine, and a cuff and sleeve.

export type Hand = "cashier" | "customer";

interface Point {
  x: number;
  y: number;
}

interface Bounds extends Point {
  width: number;
  height: number;
}

interface Tone {
  light: string;
  base: string;
  shade: string;
  edge: string;
}

interface Skin extends Tone {
  crease: string;
  nail: string;
  nailTip: string;
}

const SKINS: Record<Hand, Skin> = {
  cashier: {
    light: "#f7d6b8", base: "#e2ae88", shade: "#b67b55", edge: "#8a4d33", crease: "rgba(118, 62, 38, 0.45)", nail: "#efc5b8", nailTip: "#fbeee6",
  },
  customer: {
    light: "#cf9f77", base: "#a26e4a", shade: "#6c4228", edge: "#452515", crease: "rgba(44, 20, 9, 0.55)", nail: "#d6a893", nailTip: "#f2dccf",
  },
};

// A pressed navy shirt for the cashier, a brown knit jacket for the customer.
const CLOTH: Record<Hand, Tone> = {
  cashier: { light: "#55618a", base: "#2d3653", shade: "#1a2035", edge: "#0e1220" },
  customer: { light: "#8a765f", base: "#5d4c3b", shade: "#3a2f24", edge: "#221b14" },
};

const CUFF: Record<Hand, Tone> = {
  cashier: { light: "#6a77a2", base: "#3a4566", shade: "#232a42", edge: "#121726" },
  customer: { light: "#9a856c", base: "#6e5c48", shade: "#46392c", edge: "#2a2219" },
};

// The scene's key light, from the top left, as the direction it shines from.
const LIGHT: Point = { x: -0.6, y: -0.8 };

// The light in a hand's own frame, for a hand drawn turned by `angle`.
const lightIn = (angle: number): Point => ({
  x: LIGHT.x * Math.cos(angle) + LIGHT.y * Math.sin(angle),
  y: -LIGHT.x * Math.sin(angle) + LIGHT.y * Math.cos(angle),
});

// Device pixels per scene unit in the frame being painted, for blurs, which a transform does not scale.
const pixelsPerUnit = (context: Canvas2DContext): number => {
  const transform = typeof context.getTransform === "function" ? context.getTransform() : null;

  return transform ? Math.hypot(transform.a, transform.b) || 1 : 1;
};

const axisOf = (from: Point, to: Point) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  return { angle, normal: { x: -Math.sin(angle), y: Math.cos(angle) } };
};

// A tapered tube from `from` to `to`, both ends rounded: a finger, a thumb, a forearm. Adds to the current path.
const tubePath = (context: Canvas2DContext, from: Point, to: Point, fromWidth: number, toWidth: number) => {
  const { angle, normal } = axisOf(from, to);
  const startRadius = fromWidth / 2;
  const endRadius = toWidth / 2;

  context.moveTo(from.x + normal.x * startRadius, from.y + normal.y * startRadius);
  context.lineTo(to.x + normal.x * endRadius, to.y + normal.y * endRadius);
  context.arc(to.x, to.y, endRadius, angle + Math.PI / 2, angle - Math.PI / 2, true);
  context.lineTo(from.x - normal.x * startRadius, from.y - normal.y * startRadius);
  context.arc(from.x, from.y, startRadius, angle - Math.PI / 2, angle + Math.PI / 2, true);
  context.closePath();
};

// Shaded as a cylinder across its width: the side the light comes from bright, the far side falling into shade and
// then a warm edge, as light passing through the skin shows.
const cylinder = (context: Canvas2DContext, from: Point, to: Point, width: number, tone: Tone, light: Point) => {
  const { normal } = axisOf(from, to);
  const isNormalLit = normal.x * light.x + normal.y * light.y >= 0;
  const side = isNormalLit ? 1 : -1;
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const radius = width / 2;
  const gradient = context.createLinearGradient(
    middle.x + normal.x * radius * side, middle.y + normal.y * radius * side,
    middle.x - normal.x * radius * side, middle.y - normal.y * radius * side,
  );

  gradient.addColorStop(0, tone.base);
  gradient.addColorStop(0.28, tone.light);
  gradient.addColorStop(0.58, tone.base);
  gradient.addColorStop(0.86, tone.shade);
  gradient.addColorStop(1, tone.edge);

  return gradient;
};

// A tube filled and shaded, its outline a soft warm line.
const paintTube = (context: Canvas2DContext, from: Point, to: Point, widths: [number, number], tone: Tone, light: Point) => {
  context.beginPath();
  tubePath(context, from, to, widths[0], widths[1]);
  context.fillStyle = cylinder(context, from, to, Math.max(...widths), tone, light);
  context.fill();
  context.save();
  context.globalAlpha = 0.55;
  context.strokeStyle = tone.edge;
  context.lineWidth = 0.6;
  context.stroke();
  context.restore();
};

// A soft round light or shade laid over the skin: a knuckle catching the light, the hollow between two fingers.
const blot = (context: Canvas2DContext, at: Point, radius: number, colour: string, alpha: number) => {
  const gradient = context.createRadialGradient(at.x, at.y, 0, at.x, at.y, radius);

  gradient.addColorStop(0, colour);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(at.x, at.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

// Wrinkles across a finger at a joint, on the back of it: short curved lines, the middle one longest, and the skin
// just past them catching the light.
const creases = (context: Canvas2DContext, at: Point, angle: number, width: number, count: number, skin: Skin) => {
  context.save();
  context.translate(at.x, at.y);
  context.rotate(angle);
  context.lineCap = "round";

  for (let line = 0; line < count; line += 1) {
    const offset = (line - (count - 1) / 2) * 1.15;
    const half = (width / 2) * (line === Math.floor(count / 2) ? 0.62 : 0.45);

    context.strokeStyle = skin.crease;
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(offset, -half);
    context.quadraticCurveTo(offset - 0.7, 0, offset, half);
    context.stroke();
  }

  context.strokeStyle = skin.light;
  context.globalAlpha = 0.35;
  context.lineWidth = 0.7;
  context.beginPath();
  context.moveTo(count * 0.7, -width * 0.22);
  context.quadraticCurveTo(count * 0.7 - 0.6, 0, count * 0.7, width * 0.22);
  context.stroke();
  context.restore();
};

// A nail seen from above, its free edge towards `angle`: the plate, the pale free edge, the half moon at its root,
// the cuticle and the shine.
const nail = (context: Canvas2DContext, centre: Point, angle: number, length: number, width: number, skin: Skin) => {
  const half = length / 2;

  context.save();
  context.translate(centre.x, centre.y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(-half, -width / 2 + 0.6);
  context.quadraticCurveTo(-half, -width / 2, -half + 1, -width / 2);
  context.lineTo(half - width * 0.42, -width / 2);
  context.quadraticCurveTo(half, -width / 2, half, 0);
  context.quadraticCurveTo(half, width / 2, half - width * 0.42, width / 2);
  context.lineTo(-half + 1, width / 2);
  context.quadraticCurveTo(-half, width / 2, -half, width / 2 - 0.6);
  context.closePath();

  const plate = context.createLinearGradient(-half, 0, half, 0);

  plate.addColorStop(0, skin.nail);
  plate.addColorStop(0.8, skin.nail);
  plate.addColorStop(0.86, skin.nailTip);
  plate.addColorStop(1, skin.nailTip);
  context.fillStyle = plate;
  context.fill();
  context.strokeStyle = "rgba(60, 25, 15, 0.22)";
  context.lineWidth = 0.4;
  context.stroke();
  context.fillStyle = "rgba(255, 255, 255, 0.28)";
  context.beginPath();
  context.ellipse(-half + 1.4, 0, 1.1, width * 0.3, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = skin.crease;
  context.lineWidth = 0.45;
  context.beginPath();
  context.moveTo(-half - 0.4, -width / 2 + 0.4);
  context.quadraticCurveTo(-half - 1.1, 0, -half - 0.4, width / 2 - 0.4);
  context.stroke();
  context.fillStyle = "rgba(255, 255, 255, 0.6)";
  context.beginPath();
  context.ellipse(-half * 0.1, -width * 0.24, length * 0.26, 0.55, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

// A sleeve over the forearm from `from` back to `to`: the cloth shaded round, folds across it, and the cuff.
const sleeve = (context: Canvas2DContext, hand: Hand, from: Point, to: Point, widths: [number, number], light: Point) => {
  const { angle } = axisOf(from, to);
  const cuffEnd = { x: from.x + Math.cos(angle) * 8, y: from.y + Math.sin(angle) * 8 };

  paintTube(context, from, to, widths, CLOTH[hand], light);
  context.save();
  context.strokeStyle = CLOTH[hand].edge;
  context.lineCap = "round";
  [0.22, 0.47, 0.74].forEach((share, index) => {
    const at = { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share };
    const half = widths[0] * 0.36;

    context.globalAlpha = 0.45;
    context.lineWidth = 0.9;
    context.save();
    context.translate(at.x, at.y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(-1.5 + index, -half);
    context.quadraticCurveTo(3 + index, 0, -0.5 + index, half);
    context.stroke();
    context.restore();
  });
  context.restore();
  paintTube(context, from, cuffEnd, [widths[0] + 1.5, widths[0] + 1.5], CUFF[hand], light);

  context.save();
  context.translate(from.x, from.y);
  context.rotate(angle);

  if (hand === "cashier") {
    // The cuff's button.
    context.fillStyle = "#d9dbe3";
    context.beginPath();
    context.arc(4, widths[0] * 0.32, 1.3, 0, Math.PI * 2);
    context.fill();
  } else {
    // Ribbing on the knit cuff.
    context.strokeStyle = "rgba(0, 0, 0, 0.28)";
    context.lineWidth = 0.6;

    for (let rib = -widths[0] / 2 + 2; rib < widths[0] / 2 - 1; rib += 2.2) {
      context.beginPath();
      context.moveTo(0.8, rib);
      context.lineTo(7.2, rib);
      context.stroke();
    }
  }

  context.restore();
};

// A watch on the cashier's wrist: the strap round it and the steel case with its dark face.
const watch = (context: Canvas2DContext, centre: Point, angle: number, width: number) => {
  context.save();
  context.translate(centre.x, centre.y);
  context.rotate(angle);
  context.fillStyle = "#17181c";
  context.fillRect(-3.5, -width / 2, 7, width);
  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  context.fillRect(-3.5, -width / 2, 7, 0.8);

  const steel = context.createLinearGradient(-5, -6, 5, 6);

  steel.addColorStop(0, "#f2f3f6");
  steel.addColorStop(0.45, "#9a9ea8");
  steel.addColorStop(1, "#5c606a");
  context.fillStyle = steel;
  context.beginPath();
  context.ellipse(0, 0, 5.2, 5.6, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#0b0d12";
  context.beginPath();
  context.ellipse(0, 0, 4, 4.4, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.35)";
  context.beginPath();
  context.ellipse(-1.2, -1.6, 1.8, 0.6, -0.5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.lineWidth = 0.5;
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(0, -2.8);
  context.moveTo(0, 0);
  context.lineTo(1.9, 0.6);
  context.stroke();
  context.fillStyle = "#b8bcc6";
  context.fillRect(4.8, -1, 1.6, 2);
  context.restore();
};

// The pointing hand's parts, the fingertip at the origin and the finger along the x axis: the index straight, the
// other three curled under, the thumb along the near side, a right hand seen from its back.
const INDEX = { knuckle: { x: -50, y: 0 }, tip: { x: -4.8, y: 0 }, widths: [11, 9.6] as [number, number] };

const CURLED = [
  { knuckle: { x: -60, y: 29.5 }, bend: { x: -51, y: 31 }, width: 9 },
  { knuckle: { x: -57, y: 21 }, bend: { x: -45, y: 23 }, width: 10.4 },
  { knuckle: { x: -54, y: 11 }, bend: { x: -40, y: 13 }, width: 11 },
];

const THUMB = { base: { x: -88, y: -2 }, tip: { x: -47, y: -11 }, widths: [14, 10] as [number, number] };

const WRIST = { x: -96, y: 16 };

const POINTING_ARM = { cuff: { x: -110, y: 17 }, shoulder: { x: -228, y: 19 } };

const backOfHand = (context: Canvas2DContext) => {
  context.beginPath();
  context.moveTo(-47, -6.5);
  context.bezierCurveTo(-45, -3, -45, 3, -50, 6);
  context.bezierCurveTo(-48, 9, -48, 14, -53.5, 16.5);
  context.bezierCurveTo(-51.5, 19, -51.5, 24, -56.5, 25.5);
  context.bezierCurveTo(-54.5, 28, -55, 33, -59, 35.5);
  context.bezierCurveTo(-72, 36, -88, 34, -98, 31);
  context.lineTo(-100, 1);
  context.bezierCurveTo(-88, -4, -70, -9, -47, -6.5);
  context.closePath();
};

// A hand pointing, the fingertip at the origin: the cashier keying on the screen, or the customer keying a PIN.
// `angle` is the turn it is mostly drawn at, for its light.
export const paintPointingHand = (context: Canvas2DContext, hand: Hand, angle: number) => {
  const skin = SKINS[hand];
  const light = lightIn(angle);

  // The forearm between the cuff and the wrist, then the sleeve.
  paintTube(context, WRIST, { x: -140, y: 17 }, [29, 31], skin, light);
  sleeve(context, hand, POINTING_ARM.cuff, POINTING_ARM.shoulder, [36, 39], light);

  if (hand === "cashier") {
    watch(context, { x: -103, y: 16.5 }, 0, 30);
  }

  CURLED.forEach(({ knuckle, bend, width }) => {
    paintTube(context, knuckle, bend, [width, width], skin, light);
    // The bent joint catching the light, and its wrinkle.
    blot(context, { x: bend.x + 2, y: bend.y - 1.5 }, width * 0.42, skin.light, 0.55);
    creases(context, { x: bend.x - 2.5, y: bend.y }, 0.1, width, 2, skin);
  });

  paintTube(context, THUMB.base, THUMB.tip, THUMB.widths, skin, light);

  const thumbAxis = axisOf(THUMB.base, THUMB.tip);
  const along = { x: Math.cos(thumbAxis.angle), y: Math.sin(thumbAxis.angle) };
  // Seen from the back of the hand the thumb is turned on its side, so its nail shows on the outer half.
  const thumbAt = (forward: number, outward: number) => ({
    x: THUMB.tip.x + along.x * forward - thumbAxis.normal.x * outward,
    y: THUMB.tip.y + along.y * forward - thumbAxis.normal.y * outward,
  });

  nail(context, thumbAt(0.5, 1.4), thumbAxis.angle, 7, 5, skin);
  creases(context, thumbAt(-12, 0), thumbAxis.angle, 10, 2, skin);

  // The index finger, straight out to the fingertip.
  paintTube(context, INDEX.knuckle, INDEX.tip, INDEX.widths, skin, light);
  blot(context, { x: -31, y: -1 }, 4.2, skin.light, 0.5);
  creases(context, { x: -32, y: 0 }, 0, 10.5, 3, skin);
  creases(context, { x: -16, y: 0 }, 0, 10, 2, skin);
  nail(context, { x: -5.9, y: -0.2 }, 0, 9, 7, skin);

  // The back of the hand over the fingers' roots, rounder in the middle and darker towards its edges.
  backOfHand(context);

  const back = context.createRadialGradient(-70 + light.x * 10, 14 + light.y * 10, 2, -72, 14, 42);

  back.addColorStop(0, skin.light);
  back.addColorStop(0.5, skin.base);
  back.addColorStop(0.9, skin.shade);
  back.addColorStop(1, skin.edge);
  context.fillStyle = back;
  context.fill();
  context.save();
  context.globalAlpha = 0.5;
  context.strokeStyle = skin.edge;
  context.lineWidth = 0.7;
  context.stroke();
  context.restore();

  // The tendons fanning from the wrist to the knuckles, raised a little, each with its shade beside it.
  context.save();
  context.lineCap = "round";
  [[-53, 0, -93, 10], [-56, 11, -94, 14], [-59, 21, -94, 18.5], [-62, 30, -93, 23]].forEach(([x0, y0, x1, y1]) => {
    context.globalAlpha = 0.2;
    context.strokeStyle = skin.light;
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
    context.globalAlpha = 0.14;
    context.strokeStyle = skin.shade;
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(x0, y0 + 2);
    context.lineTo(x1, y1 + 1.6);
    context.stroke();
  });
  context.restore();

  // The knuckles, each catching the light, with the hollows between them.
  [{ x: -48, y: 0 }, { x: -51.5, y: 11.5 }, { x: -54.5, y: 21 }, { x: -57.5, y: 30 }].forEach((knuckle) => {
    blot(context, knuckle, 5, skin.light, 0.6);
  });
  [{ x: -51, y: 6 }, { x: -54, y: 16.5 }, { x: -57, y: 25.5 }].forEach((hollow) => blot(context, hollow, 3, skin.edge, 0.3));
  // Where the finger leaves the knuckle, a shade.
  blot(context, { x: -44, y: 4 }, 4, skin.edge, 0.25);
};

// The same hand's outline, for its shadow: no detail, only where it stands.
const pointingSilhouette = (context: Canvas2DContext) => {
  context.beginPath();
  tubePath(context, INDEX.knuckle, INDEX.tip, INDEX.widths[0], INDEX.widths[1]);
  tubePath(context, THUMB.base, THUMB.tip, THUMB.widths[0], THUMB.widths[1]);
  context.fill();
  context.beginPath();
  context.ellipse(-74, 15, 27, 21, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(-49, 21, 11, 15, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  tubePath(context, WRIST, POINTING_ARM.shoulder, 34, 39);
  context.fill();
};

// The holding hand's parts, the thumb's pad on what it holds at the origin and the arm out along the x axis: the
// thumb across the face, the index finger curled round the edge behind, a right hand seen from its thumb side.
const GRIP_THUMB = { base: { x: 26, y: -3 }, tip: { x: -1, y: -2.5 }, widths: [13, 10.6] as [number, number] };

const GRIP_INDEX = { knuckle: { x: 27, y: 8 }, edge: { x: 8, y: 12.5 }, width: 11 };

const GRIP_MIDDLE = { knuckle: { x: 30, y: 19 }, edge: { x: 11, y: 23 }, width: 10 };

const GRIP_ARM = { wrist: { x: 56, y: 11 }, cuff: { x: 70, y: 12 }, shoulder: { x: 204, y: 15 } };

const gripBody = (context: Canvas2DContext) => {
  context.beginPath();
  context.moveTo(12, -8);
  context.bezierCurveTo(24, -11, 44, -10, 60, -3);
  context.lineTo(61, 25);
  context.bezierCurveTo(50, 30, 34, 31, 24, 27);
  context.bezierCurveTo(20, 20, 16, 8, 11, 2);
  context.closePath();
};

// A hand holding a card or a phone by its edge, the thumb's pad at the origin. `angle` is the turn it is mostly
// drawn at, for its light.
export const paintGrippingHand = (context: Canvas2DContext, hand: Hand, angle: number) => {
  const skin = SKINS[hand];
  const light = lightIn(angle);

  paintTube(context, GRIP_ARM.wrist, { x: 110, y: 13 }, [27, 30], skin, light);
  sleeve(context, hand, GRIP_ARM.cuff, GRIP_ARM.shoulder, [33, 37], light);

  if (hand === "cashier") {
    watch(context, { x: 64, y: 11.5 }, 0, 28);
  }

  paintTube(context, GRIP_MIDDLE.knuckle, GRIP_MIDDLE.edge, [GRIP_MIDDLE.width, GRIP_MIDDLE.width], skin, light);
  gripBody(context);

  const body = context.createRadialGradient(36 + light.x * 8, 8 + light.y * 8, 2, 38, 10, 32);

  body.addColorStop(0, skin.light);
  body.addColorStop(0.5, skin.base);
  body.addColorStop(0.9, skin.shade);
  body.addColorStop(1, skin.edge);
  context.fillStyle = body;
  context.fill();
  context.save();
  context.globalAlpha = 0.5;
  context.strokeStyle = skin.edge;
  context.lineWidth = 0.7;
  context.stroke();
  context.restore();

  // The index finger round the edge, its knuckle catching the light.
  paintTube(context, GRIP_INDEX.knuckle, GRIP_INDEX.edge, [GRIP_INDEX.width, GRIP_INDEX.width], skin, light);
  blot(context, { x: 24, y: 6 }, 5, skin.light, 0.55);
  creases(context, { x: 15, y: 11 }, axisOf(GRIP_INDEX.knuckle, GRIP_INDEX.edge).angle, 10, 2, skin);
  // The web between the thumb and the index finger.
  blot(context, { x: 15, y: 3 }, 5, skin.edge, 0.3);

  // The thumb across the face, its nail towards the tip.
  paintTube(context, GRIP_THUMB.base, GRIP_THUMB.tip, GRIP_THUMB.widths, skin, light);
  blot(context, { x: 12, y: -4.5 }, 4, skin.light, 0.45);
  creases(context, { x: 9, y: -2.8 }, Math.PI, 11, 2, skin);
  nail(context, { x: -2.2, y: -2.6 }, Math.PI, 8, 7, skin);
};

const grippingSilhouette = (context: Canvas2DContext) => {
  context.beginPath();
  tubePath(context, GRIP_THUMB.base, GRIP_THUMB.tip, GRIP_THUMB.widths[0], GRIP_THUMB.widths[1]);
  tubePath(context, GRIP_INDEX.knuckle, GRIP_INDEX.edge, GRIP_INDEX.width, GRIP_INDEX.width);
  context.fill();
  context.beginPath();
  context.ellipse(38, 10, 24, 17, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  tubePath(context, GRIP_ARM.wrist, GRIP_ARM.shoulder, 31, 37);
  context.fill();
};

// Where each hand's frames are cached, around its own origin, and its shadow's, wider by the blur.
export const POINTING_BOUNDS: Bounds = { x: -232, y: -24, width: 238, height: 68 };

export const GRIPPING_BOUNDS: Bounds = { x: -10, y: -20, width: 216, height: 60 };

const SHADOW_BLUR = 5;

const widen = (bounds: Bounds, by: number): Bounds => ({ x: bounds.x - by, y: bounds.y - by, width: bounds.width + by * 2, height: bounds.height + by * 2 });

export const widenForShadow = (bounds: Bounds): Bounds => widen(bounds, SHADOW_BLUR * 2);

export const POINTING_SHADOW_BOUNDS = widen(POINTING_BOUNDS, SHADOW_BLUR * 2);

export const GRIPPING_SHADOW_BOUNDS = widen(GRIPPING_BOUNDS, SHADOW_BLUR * 2);

// Far enough to the left that a shape drawn there is off any frame, so only the shadow thrown back from it shows.
const AWAY = 4000;

// A soft shadow of a silhouette, blurred, with none of the silhouette itself: the silhouette is drawn opaque into a
// frame of its own (so where its parts overlap the shadow is no darker), that frame drawn far off this one, and only
// its shadow thrown back.
export const paintSoftShadow = (context: Canvas2DContext, bounds: Bounds, draw: (target: Canvas2DContext) => void) => {
  const scale = pixelsPerUnit(context);
  const silhouette = createDrawableSurface(Math.ceil(bounds.width * scale), Math.ceil(bounds.height * scale));

  if (!silhouette) {
    return;
  }

  silhouette.context.scale(scale, scale);
  silhouette.context.translate(-bounds.x, -bounds.y);
  silhouette.context.fillStyle = "#000";
  draw(silhouette.context);
  context.save();
  context.shadowColor = "rgba(0, 0, 0, 1)";
  context.shadowBlur = SHADOW_BLUR * scale;
  context.shadowOffsetX = AWAY * scale;
  context.drawImage(silhouette.surface, bounds.x - AWAY, bounds.y, bounds.width, bounds.height);
  context.restore();
};

export const paintPointingShadow = (context: Canvas2DContext) => paintSoftShadow(context, POINTING_BOUNDS, pointingSilhouette);

export const paintGrippingShadow = (context: Canvas2DContext) => paintSoftShadow(context, GRIPPING_BOUNDS, grippingSilhouette);

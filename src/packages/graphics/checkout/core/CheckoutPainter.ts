import type { Canvas2DContext } from "@/packages/graphics/canvas";

import { CheckoutLook, CheckoutSkin, CustomerPose, CustomerSprite, MarkShape, ScreenState } from "../domain/types";
import { paintCardFace } from "./cardFace";
import {
  amountShown, APP_TILE, appCentre, BODY, CAMERA, CARD, COUNTER_TOP, KEYPAD, keyCentre, OK_KEY, PHONE, SCREEN, SMILE_BUTTON, STAND, STRIPE,
} from "./geometry";
import { paintSoftShadow } from "./hands";

// How the checkout scene is drawn: a smart terminal on a stand on a counter, lit from the top left, with shaded
// glass, and cards and phones in their own colours (the hands are in `hands.ts`). Everything here paints at the
// scene's own units around a fixed origin, so the rig caches each part once and only moves it.

const roundRect = (context: Canvas2DContext, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const linear = (context: Canvas2DContext, x0: number, y0: number, x1: number, y1: number, stops: Array<[number, string]>) => {
  const gradient = context.createLinearGradient(x0, y0, x1, y1);

  stops.forEach(([offset, colour]) => gradient.addColorStop(offset, colour));

  return gradient;
};

const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c)
.join("") : value;
  const channel = (index: number) => parseInt(full.slice(index, index + 2), 16);

  return `rgba(${channel(0)}, ${channel(2)}, ${channel(4)}, ${alpha})`;
};

// A mark from its path data, fitted into a box and centred in it.
const paintMark = (context: Canvas2DContext, mark: MarkShape, box: { x: number; y: number; width: number; height: number }) => {
  if (typeof Path2D === "undefined") {
    return;
  }

  const scale = Math.min(box.width / mark.width, box.height / mark.height);

  context.save();
  context.translate(box.x + (box.width - mark.width * scale) / 2, box.y + (box.height - mark.height * scale) / 2);
  context.scale(scale, scale);
  mark.parts.forEach(({ d, fill, stroke, strokeWidth = 1 }) => {
    const path = new Path2D(d);

    if (fill) {
      context.fillStyle = fill;
      context.fill(path);
    }

    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = strokeWidth;
      context.lineJoin = "round";
      context.stroke(path);
    }
  });
  context.restore();
};

const contactless = (context: Canvas2DContext, x: number, y: number, size: number, colour: string, width = 1.4) => {
  context.save();
  context.strokeStyle = colour;
  context.lineWidth = width;
  context.lineCap = "round";
  [0.35, 0.65, 0.95].forEach((share) => {
    context.beginPath();
    context.arc(x - size * 0.5, y, size * share, -0.75, 0.75);
    context.stroke();
  });
  context.restore();
};

export const paintCounter = (context: Canvas2DContext, accent: string) => {
  context.fillStyle = linear(context, 0, COUNTER_TOP - 2, 0, COUNTER_TOP + 10, [[0, "#2c2d32"], [1, "#1b1c20"]]);
  context.fillRect(0, COUNTER_TOP - 2, 300, 12);
  context.fillStyle = linear(context, 0, COUNTER_TOP + 10, 0, 210, [[0, "#161719"], [1, "#0c0c0e"]]);
  context.fillRect(0, COUNTER_TOP + 10, 300, 210 - COUNTER_TOP - 10);
  context.fillStyle = "rgba(255, 255, 255, 0.07)";
  context.fillRect(0, COUNTER_TOP - 2, 300, 1);
  context.fillStyle = linear(context, 0, 0, 300, 0, [[0, withAlpha(accent, 0)], [0.5, withAlpha(accent, 0.35)], [1, withAlpha(accent, 0)]]);
  context.fillRect(0, COUNTER_TOP + 9, 300, 1);
};

export const paintStand = (context: Canvas2DContext) => {
  const { foot, neck } = STAND;
  const shadow = context.createRadialGradient(foot.x, foot.y + 1, 2, foot.x, foot.y + 1, foot.rx + 14);

  shadow.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = shadow;
  context.beginPath();
  context.ellipse(foot.x, foot.y + 1, foot.rx + 14, foot.ry + 4, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = linear(context, foot.x - foot.rx, 0, foot.x + foot.rx, 0, [[0, "#1d1e22"], [0.4, "#45464c"], [1, "#18191c"]]);
  context.beginPath();
  context.ellipse(foot.x, foot.y, foot.rx, foot.ry, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = linear(context, neck.x, 0, neck.x + neck.width, 0, [[0, "#1f2024"], [0.45, "#4a4b51"], [1, "#1a1b1e"]]);
  roundRect(context, neck.x, BODY.y + BODY.height - 6, neck.width, foot.y - (BODY.y + BODY.height - 6), 3);
  context.fill();
};

export const paintReceipt = (context: Canvas2DContext) => {
  const width = 28;
  const x = 150 - width / 2;
  const top = BODY.y - 34;
  const height = 46;

  context.fillStyle = linear(context, x, 0, x + width, 0, [[0, "#e9e6de"], [0.5, "#f7f5ef"], [1, "#e2dfd6"]]);
  context.beginPath();
  context.moveTo(x, top + 3);

  // A torn top edge.
  for (let step = 0; step <= 7; step += 1) {
    context.lineTo(x + (width / 7) * step, top + (step % 2 === 0 ? 3 : 0));
  }

  context.lineTo(x + width, top + height);
  context.lineTo(x, top + height);
  context.closePath();
  context.fill();
  context.fillStyle = "#a19d93";
  [[0.7, 9], [0.5, 14], [0.6, 18], [0.35, 22]].forEach(([share, y]) => context.fillRect(x + 4, top + y, (width - 8) * share, 1.4));
  context.fillRect(x + 4, top + 27, width - 8, 0.8);
  context.fillRect(x + width - 12, top + 30, 8, 1.6);
};

export const paintBody = (context: Canvas2DContext, accent: string) => {
  const { x, y, width, height, radius } = BODY;

  const pixels = typeof context.getTransform === "function" ? context.getTransform().a || 1 : 1;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.55)";
  context.shadowBlur = 14 * pixels;
  context.shadowOffsetY = 6 * pixels;
  context.fillStyle = linear(context, 0, y, 0, y + height, [[0, "#38393f"], [0.55, "#26272c"], [1, "#1a1b1f"]]);
  roundRect(context, x, y, width, height, radius);
  context.fill();
  context.restore();

  // The light from the top left along the left edge, and the shade down the right.
  context.save();
  roundRect(context, x, y, width, height, radius);
  context.clip();
  context.fillStyle = linear(context, x, 0, x + width, 0, [
    [0, "rgba(255, 255, 255, 0.10)"],
    [0.25, "rgba(255, 255, 255, 0)"],
    [0.8, "rgba(0, 0, 0, 0)"],
    [1, "rgba(0, 0, 0, 0.28)"],
  ]);
  context.fillRect(x, y, width, height);
  context.restore();

  context.strokeStyle = "rgba(255, 255, 255, 0.10)";
  context.lineWidth = 1;
  roundRect(context, x + 0.5, y + 0.5, width - 1, height - 1, radius - 0.5);
  context.stroke();

  // The printer's mouth at the top, and the front camera beside it.
  context.fillStyle = "#0a0a0c";
  roundRect(context, x + 13, y + 3, width - 26, 3.5, 1.5);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  context.fillRect(x + 13, y + 7, width - 26, 0.7);
  context.fillStyle = "#050507";
  context.beginPath();
  context.arc(CAMERA.x, CAMERA.y, CAMERA.radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(120, 150, 255, 0.35)";
  context.beginPath();
  context.arc(CAMERA.x - 0.5, CAMERA.y - 0.5, CAMERA.radius * 0.35, 0, Math.PI * 2);
  context.fill();

  // The screen's black glass.
  context.fillStyle = "#050506";
  roundRect(context, SCREEN.x - 3, SCREEN.y - 3, SCREEN.width + 6, SCREEN.height + 6, SCREEN.radius + 2);
  context.fill();

  // A small light under the screen in the accent, and the speaker.
  context.fillStyle = withAlpha(accent, 0.9);
  context.beginPath();
  context.arc(150, SCREEN.y + SCREEN.height + 9, 1.6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(0, 0, 0, 0.45)";
  [-6, -3, 0, 3, 6].forEach((offset) => context.fillRect(150 + offset - 0.6, SCREEN.y + SCREEN.height + 15, 1.2, 4));

  // The chip reader's mouth at the foot.
  context.fillStyle = "#0b0b0d";
  roundRect(context, x + 14, y + height - 6, width - 28, 4, 1.6);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.06)";
  context.fillRect(x + 14, y + height - 1.6, width - 28, 0.7);

  // The stripe reader's groove down the right side.
  context.fillStyle = "#0c0c0e";
  context.fillRect(STRIPE.x - 3, STRIPE.top, 2.2, STRIPE.bottom - STRIPE.top);
  context.fillStyle = "rgba(255, 255, 255, 0.08)";
  context.fillRect(STRIPE.x - 0.8, STRIPE.top, 0.6, STRIPE.bottom - STRIPE.top);
};

// A soft reflection across the glass, over whatever the screen shows.
export const paintGlass = (context: Canvas2DContext) => {
  context.save();
  roundRect(context, SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height, SCREEN.radius);
  context.clip();
  context.fillStyle = linear(context, SCREEN.x, SCREEN.y, SCREEN.x + SCREEN.width, SCREEN.y + SCREEN.height * 0.6, [
    [0, "rgba(255, 255, 255, 0.10)"],
    [0.35, "rgba(255, 255, 255, 0.03)"],
    [0.36, "rgba(255, 255, 255, 0)"],
    [1, "rgba(255, 255, 255, 0)"],
  ]);
  context.fillRect(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height);
  context.restore();
};

const FONT = "Roboto, Helvetica, Arial, sans-serif";

const text = (context: Canvas2DContext, value: string, x: number, y: number, size: number, weight: number, colour: string) => {
  context.font = `${weight} ${size}px ${FONT}`;
  context.fillStyle = colour;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(value, x, y);
};

// The total, or where a switch carries no words, a bar standing for it.
const total = (context: Canvas2DContext, value: string, x: number, y: number, size: number, colour: string, accent: string) => {
  if (value) {
    text(context, value, x, y, size, 700, colour);

    return;
  }

  context.fillStyle = withAlpha(accent, 0.85);
  roundRect(context, x - size, y - 2, size * 2, 4, 2);
  context.fill();
};

const KEY_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", ""];

const paintKeypad = (context: Canvas2DContext, accent: string, pressed: number | null) => {
  KEY_LABELS.forEach((label, index) => {
    const { x, y } = keyCentre(index);
    const isOk = index === OK_KEY;
    const isPressed = pressed === index;

    context.fillStyle = isOk ? withAlpha(accent, isPressed ? 1 : 0.85) : isPressed ? withAlpha(accent, 0.55) : "#16221e";
    roundRect(context, x - KEYPAD.width / 2, y - KEYPAD.height / 2, KEYPAD.width, KEYPAD.height, 2.5);
    context.fill();

    if (isOk) {
      // A tick for OK, so the key needs no word.
      context.strokeStyle = "#071410";
      context.lineWidth = 1.6;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x - 3.5, y);
      context.lineTo(x - 1, y + 2.6);
      context.lineTo(x + 3.8, y - 2.6);
      context.stroke();
    } else {
      text(context, label, x, y + 0.5, 7.5, 600, isPressed ? "#04110d" : "#d5ece4");
    }
  });
};

const paintAppIcon = (context: Canvas2DContext, app: number, x: number, y: number, colour: string) => {
  context.save();
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.lineWidth = 1.2;

  if (app === 0) {
    roundRect(context, x - 5.5, y - 3.8, 11, 7.6, 1.4);
    context.stroke();
    context.fillRect(x - 5.5, y - 1.6, 11, 1.4);
  } else if (app === 1) {
    [[-4.5, -4.5], [1.5, -4.5], [-4.5, 1.5]].forEach(([dx, dy]) => {
      context.strokeRect(x + dx, y + dy, 3, 3);
    });
    context.fillRect(x + 2, y + 2, 1.6, 1.6);
    context.fillRect(x + 3.6, y + 3.6, 1.2, 1.2);
  } else {
    context.beginPath();
    context.arc(x, y, 4.6, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(x, y, 2.2, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};

// A QR code from a fixed pattern of modules, with its three finder squares.
const paintQr = (context: Canvas2DContext, x: number, y: number, size: number) => {
  const cells = 13;
  const cell = size / cells;
  const isFinder = (row: number, column: number) => [[0, 0], [0, cells - 5], [cells - 5, 0]]
    .some(([top, left]) => row >= top && row < top + 5 && column >= left && column < left + 5);

  context.fillStyle = "#f4f4f4";
  roundRect(context, x - 2, y - 2, size + 4, size + 4, 2);
  context.fill();
  context.fillStyle = "#101010";

  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const finder = isFinder(row, column);
      const ring = finder && (row % (cells - 5) === 0 || row % (cells - 5) === 4 || column % (cells - 5) === 0 || column % (cells - 5) === 4);
      const centre = finder && !ring && (row % (cells - 5) === 1 || row % (cells - 5) === 3 || column % (cells - 5) === 1 || column % (cells - 5) === 3);
      const isOn = finder ? !centre : (row * 7 + column * 11 + row * column) % 5 < 2;

      if (isOn) {
        context.fillRect(x + column * cell, y + row * cell, cell + 0.15, cell + 0.15);
      }
    }
  }
};

export interface ScreenView {
  state: ScreenState;
  typed: number;
  pin: number;
  pressed: number | null;
  spinner: number;
  // How far the camera has got matching a face, 0 to 1, and the customer it sees, as she moves.
  scan: number;
  customer?: CustomerPose;
}

// The terminal's camera reading the customer's face to pay by it: what it sees across the screen, darkened outside the
// guide the face is lined up in, its points mapped one by one into a mesh as a line sweeps it, the guide turning the
// accent once it matches. Until the picture of the customer is in, the face is drawn in fine lines. Asking, only the
// guide, and the button to tap.
const FACE = { offset: 44, rx: 17, ry: 22 } as const;

// A face in fine lines over the camera's dark: its outline, eyes, nose and a mouth that smiles as it is read.
const paintLineFace = (context: Canvas2DContext, centre: number, cy: number, progress: number) => {
  const { rx, ry } = FACE;

  context.fillStyle = "#0d1714";
  context.fillRect(centre - rx, cy - ry, rx * 2, ry * 2);
  context.strokeStyle = "rgba(213, 236, 228, 0.5)";
  context.lineWidth = 0.6;
  context.beginPath();
  context.ellipse(centre, cy + 1, rx * 0.72, ry * 0.86, 0, 0, Math.PI * 2);
  [-1, 1].forEach((side) => {
    context.moveTo(centre + side * 3.2 + 2.6, cy - 4);
    context.ellipse(centre + side * 4.4, cy - 4, 2.6, 1.1, 0, 0, Math.PI * 2);
  });
  context.moveTo(centre, cy - 3);
  context.lineTo(centre - 1.4, cy + 4);
  context.lineTo(centre + 1.4, cy + 4.6);
  context.moveTo(centre - 4.5, cy + 9);
  context.quadraticCurveTo(centre, cy + 11.5 + progress * 1.5, centre + 4.5, cy + 9);
  context.stroke();
};

// How the customer's movements move her in the front camera's view: picture units on the screen per millimetre she moves
// across it or up, per radian she turns or nods, and the growth per millimetre she leans in.
const SEEN_SHIFT = { perMm: 0.23, perTurn: 34, perNod: 18, perLean: 0.004 } as const;

const paintSeen = (context: Canvas2DContext, seen: CustomerSprite, pose: CustomerPose | undefined) => {
  const { x, y, width, height } = SCREEN;
  const frame = (pose?.blink ?? 0) > 0.5 ? 1 : 0;
  const frameWidth = seen.width / 2;
  // As she sees herself: the picture is mirrored, so moving to her side moves her the same way on the screen.
  const dx = pose ? pose.side * SEEN_SHIFT.perMm + pose.turn * SEEN_SHIFT.perTurn : 0;
  const dy = pose ? -pose.rise * SEEN_SHIFT.perMm + pose.nod * SEEN_SHIFT.perNod : 0;
  const grow = pose ? 1 + pose.lean * SEEN_SHIFT.perLean : 1;
  const drawnWidth = width * grow;
  const drawnHeight = height * grow;

  context.drawImage(seen.picture, frame * frameWidth, 0, frameWidth, seen.height,
    x + (width - drawnWidth) / 2 + dx, y + (height - drawnHeight) / 2 + dy, drawnWidth, drawnHeight);
};

const paintFaceCamera = (
  context: Canvas2DContext, accent: string, centre: number, top: number, scan: number | null, seen?: CustomerSprite | null, pose?: CustomerPose,
) => {
  const cy = top + FACE.offset;
  const { rx, ry } = FACE;
  const progress = scan ?? 0;
  const isMatched = progress > 0.97;

  if (scan !== null && seen) {
    const { x, y, width, height } = SCREEN;

    // The front camera's view, the customer as she sees herself, moving as she does, dark outside the guide.
    context.fillStyle = "#0a1411";
    context.fillRect(x, y, width, height);
    paintSeen(context, seen, pose);
    context.fillStyle = "rgba(4, 12, 10, 0.42)";
    context.beginPath();
    context.rect(x, y, width, height);
    context.ellipse(centre, cy, rx, ry, 0, 0, Math.PI * 2);
    context.fill("evenodd");
  }

  if (scan !== null) {
    context.save();
    context.beginPath();
    context.ellipse(centre, cy, rx, ry, 0, 0, Math.PI * 2);
    context.clip();

    if (!seen) {
      paintLineFace(context, centre, cy, progress);
    }

    // The camera's cast, and the dark round its edge.
    const shade = context.createRadialGradient(centre, cy, rx * 0.4, centre, cy, ry * 1.05);

    shade.addColorStop(0, withAlpha(accent, 0.06));
    shade.addColorStop(1, seen ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.55)");
    context.fillStyle = shade;
    context.fillRect(centre - rx, cy - ry, rx * 2, ry * 2);

    // The mesh: points across the face, each mapped as the read reaches it, joined to the one before.
    const rows = [-0.55, -0.3, -0.05, 0.2, 0.45, 0.7];
    const points = rows.flatMap((row, rowIndex) => {
      const across = Math.sqrt(Math.max(0, 1 - row * row)) * 0.78;
      const count = 3 + (rowIndex % 2);

      return Array.from({ length: count }, (_, column) => ({
        x: centre + (count === 1 ? 0 : (column / (count - 1) - 0.5) * 2 * across * rx),
        y: cy + row * ry,
      }));
    });
    const lit = Math.floor(points.length * progress);

    context.strokeStyle = withAlpha(accent, 0.45);
    context.lineWidth = 0.4;
    context.beginPath();
    points.slice(0, lit).forEach((point, index) => {
      if (index > 0) {
        context.moveTo(points[index - 1].x, points[index - 1].y);
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
    context.fillStyle = accent;
    points.slice(0, lit).forEach((point) => {
      context.beginPath();
      context.arc(point.x, point.y, 0.7, 0, Math.PI * 2);
      context.fill();
    });

    if (progress > 0 && progress < 1) {
      const line = cy - ry + ry * 2 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 3));

      context.fillStyle = linear(context, centre - rx, 0, centre + rx, 0, [[0, withAlpha(accent, 0)], [0.5, withAlpha(accent, 0.95)], [1, withAlpha(accent, 0)]]);
      context.fillRect(centre - rx, line - 0.6, rx * 2, 1.2);
    }

    context.restore();
  }

  // The guide the face is lined up in.
  context.strokeStyle = isMatched ? accent : withAlpha(accent, scan === null ? 0.6 : 0.85);
  context.lineWidth = isMatched ? 1.8 : 1.2;
  context.setLineDash(scan === null || isMatched ? [] : [2.5, 2]);
  context.beginPath();
  context.ellipse(centre, cy, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
};

// The button the customer taps to pay with their face: a smile in the accent.
const paintSmileButton = (context: Canvas2DContext, accent: string) => {
  const { x, y, width, height } = SMILE_BUTTON;

  context.fillStyle = accent;
  roundRect(context, x - width / 2, y - height / 2, width, height, height / 2);
  context.fill();
  context.strokeStyle = "#04110d";
  context.lineWidth = 1.3;
  context.lineCap = "round";
  context.beginPath();
  context.arc(x, y - 1.2, 3.6, Math.PI * 0.15, Math.PI * 0.85);
  context.stroke();
  context.fillStyle = "#04110d";
  [-2, 2].forEach((dx) => {
    context.beginPath();
    context.arc(x + dx, y - 2.6, 0.8, 0, Math.PI * 2);
    context.fill();
  });
};

// The front camera's light while it reads a face.
export const paintCameraLight = (context: Canvas2DContext, accent: string, isOn: boolean) => {
  if (!isOn) {
    return;
  }

  const glow = context.createRadialGradient(CAMERA.x, CAMERA.y, 0, CAMERA.x, CAMERA.y, 6);

  glow.addColorStop(0, withAlpha(accent, 0.75));
  glow.addColorStop(1, withAlpha(accent, 0));
  context.fillStyle = glow;
  context.fillRect(CAMERA.x - 6, CAMERA.y - 6, 12, 12);
  context.fillStyle = withAlpha(accent, 0.95);
  context.beginPath();
  context.arc(CAMERA.x, CAMERA.y, CAMERA.radius * 0.45, 0, Math.PI * 2);
  context.fill();
};

export const paintScreen = (context: Canvas2DContext, skin: CheckoutSkin, view: ScreenView) => {
  const { accent, amount, look } = skin;
  const { x, y, width, height, radius } = SCREEN;
  const centre = x + width / 2;

  context.save();
  roundRect(context, x, y, width, height, radius);
  context.clip();
  context.fillStyle = linear(context, 0, y, 0, y + height, [[0, "#0f1b18"], [1, "#07100d"]]);
  context.fillRect(x, y, width, height);

  const glow = context.createRadialGradient(centre, y + height * 0.45, 2, centre, y + height * 0.45, width);

  glow.addColorStop(0, withAlpha(accent, 0.1));
  glow.addColorStop(1, withAlpha(accent, 0));
  context.fillStyle = glow;
  context.fillRect(x, y, width, height);

  // A status bar: the app's light on the left, signal and battery on the right.
  context.fillStyle = withAlpha(accent, 0.9);
  context.beginPath();
  context.arc(x + 5, y + 4.5, 1.3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(213, 236, 228, 0.55)";
  [1.5, 2.5, 3.5].forEach((bar, index) => context.fillRect(x + width - 16 + index * 2, y + 6 - bar, 1.2, bar));
  context.strokeStyle = "rgba(213, 236, 228, 0.55)";
  context.lineWidth = 0.7;
  context.strokeRect(x + width - 8.5, y + 2.8, 5, 3);
  context.fillRect(x + width - 7.8, y + 3.5, 3, 1.6);

  const { state, typed, pin, pressed, spinner } = view;
  const keyed = amountShown(amount, typed);

  if (state === "idle") {
    context.strokeStyle = withAlpha(accent, 0.85);
    context.lineWidth = 1.6;
    context.beginPath();
    context.arc(centre, y + 40, 9, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = withAlpha(accent, 0.85);
    context.beginPath();
    context.arc(centre, y + 40, 3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(213, 236, 228, 0.18)";
    roundRect(context, centre - 16, y + 60, 32, 3, 1.5);
    context.fill();
    roundRect(context, centre - 10, y + 67, 20, 3, 1.5);
    context.fill();
  } else if (state === "keying" || state === "apps") {
    text(context, keyed, centre, y + 15, 12, 700, "#eafff7");

    if (state === "keying") {
      // The caret after the amount being keyed.
      context.font = `700 12px ${FONT}`;
      const after = context.measureText(keyed).width / 2;

      context.fillStyle = withAlpha(accent, 0.9);
      context.fillRect(centre + after + 1.5, y + 9.5, 1, 11);
      paintKeypad(context, accent, pressed);
    } else {
      [0, 1, 2].forEach((app) => {
        const tile = appCentre(app);
        const isChosen = pressed === app;

        context.fillStyle = isChosen ? accent : "#16221e";
        roundRect(context, tile.x - APP_TILE.size / 2, tile.y - APP_TILE.size / 2, APP_TILE.size, APP_TILE.size, 3.5);
        context.fill();
        paintAppIcon(context, app, tile.x, tile.y, isChosen ? "#04110d" : withAlpha(accent, 0.95));
      });
    }
  } else if (state === "ask") {
    total(context, amount, centre, y + 18, 13, "#eafff7", accent);

    if (look.gesture === "scan") {
      paintQr(context, centre - 19, y + 34, 38);
    } else if (look.gesture === "face") {
      paintFaceCamera(context, accent, centre, y, null);
      paintSmileButton(context, accent);
    } else {
      contactless(context, centre + 4, y + 48, 18, accent, 2);
      // A card in the chip reader, for the ways in that need no phone.
      context.strokeStyle = withAlpha(accent, 0.8);
      context.lineWidth = 1.2;
      roundRect(context, centre - 9, y + 66, 18, 12, 2);
      context.stroke();
      context.fillStyle = withAlpha(accent, 0.8);
      context.fillRect(centre - 6, y + 69.5, 4, 3);
      context.fillStyle = "rgba(213, 236, 228, 0.35)";
      context.fillRect(centre - 12, y + 82, 24, 1.2);
    }
  } else if (state === "pin") {
    [0, 1, 2, 3].forEach((digit) => {
      const dot = centre - 13.5 + digit * 9;

      context.beginPath();
      context.arc(dot, y + 15, 3, 0, Math.PI * 2);

      if (digit < pin) {
        context.fillStyle = accent;
        context.fill();
      } else {
        context.strokeStyle = withAlpha(accent, 0.7);
        context.lineWidth = 1;
        context.stroke();
      }
    });
    paintKeypad(context, accent, pressed);
  } else if (state === "face") {
    paintFaceCamera(context, accent, centre, y + 6, view.scan, look.customer, view.customer);
    total(context, amount, centre, y + 12, 9, "rgba(234, 255, 247, 0.85)", accent);
  } else if (state === "processing") {
    total(context, amount, centre, y + 18, 11, "rgba(234, 255, 247, 0.8)", accent);
    context.strokeStyle = withAlpha(accent, 0.18);
    context.lineWidth = 3;
    context.beginPath();
    context.arc(centre, y + 50, 12, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = accent;
    context.lineCap = "round";
    context.beginPath();
    const start = spinner * Math.PI * 3 - Math.PI / 2;

    context.arc(centre, y + 50, 12, start, start + Math.PI * 0.75);
    context.stroke();
  } else {
    context.fillStyle = accent;
    context.beginPath();
    context.arc(centre, y + 44, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#04110d";
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(centre - 6, y + 44);
    context.lineTo(centre - 1.5, y + 48.5);
    context.lineTo(centre + 6.5, y + 39.5);
    context.stroke();
    total(context, amount, centre, y + 72, 11, "#eafff7", accent);
  }

  context.restore();
};

// The contactless sign's glow, pulsing out round the card or phone held to the sign in the middle of the screen.
export const paintWaves = (context: Canvas2DContext, accent: string, strength: number) => {
  if (strength <= 0) {
    return;
  }

  [0, 1, 2].forEach((ring) => {
    const grow = (strength + ring * 0.33) % 1;

    context.strokeStyle = withAlpha(accent, 0.5 * strength * (1 - grow));
    context.lineWidth = 1.6;
    context.beginPath();
    context.arc(153, SCREEN.y + 50, 14 + grow * 26, Math.PI * 1.08, Math.PI * 1.92);
    context.stroke();
  });
};

// A card in its network's colours: the chip, the contactless sign and the mark, with a sheen across the print.
export const paintCard = (context: Canvas2DContext, look: CheckoutLook, isUpright: boolean) => {
  const width = isUpright ? CARD.short : CARD.long;
  const height = isUpright ? CARD.long : CARD.short;
  const left = -width / 2;
  const top = -height / 2;

  // A card with its own design prints that face, turned on its side going into a reader.
  if (look.card) {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.5)";
    context.shadowBlur = 7;
    context.shadowOffsetY = 3;
    context.fillStyle = look.card.face[1];
    roundRect(context, left, top, width, height, CARD.radius);
    context.fill();
    context.restore();
    context.save();

    if (isUpright) {
      context.rotate(-Math.PI / 2);
    }

    context.translate(-CARD.long / 2, -CARD.short / 2);
    paintCardFace(context, look, look.card);
    context.restore();

    return;
  }

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 7;
  context.shadowOffsetY = 3;
  context.fillStyle = linear(context, left, top, left + width, top + height, [[0, look.face[0]], [1, look.face[1]]]);
  roundRect(context, left, top, width, height, CARD.radius);
  context.fill();
  context.restore();

  context.save();
  roundRect(context, left, top, width, height, CARD.radius);
  context.clip();
  context.fillStyle = linear(context, left, top, left + width * 0.7, top + height, [
    [0, "rgba(255, 255, 255, 0.22)"],
    [0.45, "rgba(255, 255, 255, 0.04)"],
    [0.46, "rgba(255, 255, 255, 0)"],
    [1, "rgba(0, 0, 0, 0.12)"],
  ]);
  context.fillRect(left, top, width, height);
  context.restore();

  // The chip, near the leading edge as it goes into a reader.
  const chip = isUpright ? { x: left + 6, y: top + 7 } : { x: left + 8, y: top + 12 };

  context.fillStyle = linear(context, chip.x, chip.y, chip.x + 10, chip.y + 8, [[0, "#f0d58a"], [0.5, "#c9a24a"], [1, "#a8812f"]]);
  roundRect(context, chip.x, chip.y, 10, 8, 1.6);
  context.fill();
  context.strokeStyle = "rgba(90, 64, 16, 0.6)";
  context.lineWidth = 0.6;
  context.beginPath();
  context.moveTo(chip.x + 3.3, chip.y);
  context.lineTo(chip.x + 3.3, chip.y + 8);
  context.moveTo(chip.x + 6.7, chip.y);
  context.lineTo(chip.x + 6.7, chip.y + 8);
  context.moveTo(chip.x, chip.y + 4);
  context.lineTo(chip.x + 10, chip.y + 4);
  context.stroke();

  contactless(context, chip.x + (isUpright ? 6 : 17), chip.y + (isUpright ? 16 : 4), 7, "rgba(255, 255, 255, 0.75)", 0.9);

  const box = isUpright
    ? { x: left + 5, y: top + height - 14, width: width - 10, height: 10 }
    : { x: left + width - 24, y: top + height - 14, width: 20, height: 11 };

  paintMark(context, look.mark, box);

  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.lineWidth = 0.7;
  roundRect(context, left + 0.35, top + 0.35, width - 0.7, height - 0.7, CARD.radius);
  context.stroke();
};

// A phone, its screen in the wallet's or the method's colours with the mark; a phone scanning shows its
// camera's frame instead of the wallet's card.
export const paintPhone = (context: Canvas2DContext, look: CheckoutLook) => {
  const { width, height, radius } = PHONE;
  const left = -width / 2;
  const top = -height / 2;
  const isScanning = look.gesture === "scan";

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.55)";
  context.shadowBlur = 8;
  context.shadowOffsetY = 3;
  context.fillStyle = linear(context, left, 0, left + width, 0, [[0, "#2a2b30"], [0.5, "#121215"], [1, "#2a2b30"]]);
  roundRect(context, left, top, width, height, radius);
  context.fill();
  context.restore();

  context.fillStyle = linear(context, left, top, left + width, top + height, [[0, look.face[0]], [1, look.face[1]]]);
  roundRect(context, left + 2, top + 2, width - 4, height - 4, radius - 1.5);
  context.fill();

  if (isScanning) {
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    roundRect(context, left + 2, top + 2, width - 4, height - 4, radius - 1.5);
    context.fill();
    paintMark(context, look.mark, { x: left + 7, y: top + 8, width: width - 14, height: 8 });
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.lineWidth = 1.2;
    const frame = { x: left + 6, y: top + 20, size: width - 12 };
    const corner = 4;

    [[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      const px = frame.x + cx * frame.size;
      const py = frame.y + cy * frame.size;

      context.beginPath();
      context.moveTo(px, py + dy * corner);
      context.lineTo(px, py);
      context.lineTo(px + dx * corner, py);
      context.stroke();
    });
  } else {
    paintMark(context, look.mark, { x: left + 6, y: top + height / 2 - 8, width: width - 12, height: 16 });
  }

  // The camera notch and a highlight along the frame.
  context.fillStyle = "#050506";
  roundRect(context, -4, top + 3.5, 8, 2.4, 1.2);
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.lineWidth = 0.7;
  roundRect(context, left + 0.35, top + 0.35, width - 0.7, height - 0.7, radius);
  context.stroke();
};

// The camera's scan line, swept across its frame while the phone reads the QR code.
export const paintSweep = (context: Canvas2DContext, accent: string, sweep: number) => {
  if (sweep <= 0) {
    return;
  }

  const { width, height } = PHONE;
  const top = -height / 2 + 20;
  const size = width - 12;
  const y = top + size * (0.5 - 0.5 * Math.cos(sweep * Math.PI * 4));

  context.fillStyle = linear(context, -size / 2, 0, size / 2, 0, [[0, withAlpha(accent, 0)], [0.5, withAlpha(accent, 0.95)], [1, withAlpha(accent, 0)]]);
  context.fillRect(-size / 2, y, size, 1.4);
};

// The corners of the view darkened a little, as a lens does, whatever the camera does.
export const paintVignette = (context: Canvas2DContext) => {
  const glow = context.createRadialGradient(150, 96, 60, 150, 96, 190);

  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 300, 210);
};

// The soft shadow a card or a phone throws on the terminal, the card on its long side or upright.
export const paintItemShadow = (context: Canvas2DContext, isPhone: boolean, isUpright: boolean) => {
  const width = isPhone ? PHONE.width : isUpright ? CARD.short : CARD.long;
  const height = isPhone ? PHONE.height : isUpright ? CARD.long : CARD.short;
  const radius = isPhone ? PHONE.radius : CARD.radius;

  paintSoftShadow(context, { x: -width / 2 - 2, y: -height / 2 - 2, width: width + 4, height: height + 4 }, (target) => {
    roundRect(target, -width / 2, -height / 2, width, height, radius);
    target.fill();
  });
};

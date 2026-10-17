import { Canvas2DContext, createDrawableSurface } from "@/packages/graphics/canvas";

import { CardDesign, CheckoutLook, MarkShape } from "../domain/types";
import { CARD } from "./geometry";

// A card's face as its issuer prints it, in the card's own units (60 by 38, as the scene draws a card), so the same
// face is the 3D card's picture and the flat card's print: its finish (brushed metal, laminated gloss, velvet matte,
// frosted clear), the chip, the contactless sign, the issuer's mark (a monogram, or the holder's portrait as a halftone
// across the card), the number's last four, the holder's name and the network's mark.

// The size the 3D card's picture is painted at, in pixels: a card's own proportions.
export const CARD_PICTURE = { width: 1024, height: 648 } as const;

const FONT = "Roboto, Helvetica, Arial, sans-serif";

const roundRect = (context: Canvas2DContext, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
};

// Seeded, so a brushed face is the same every time it is painted.
const grain = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;

    return state / 2147483647;
  };
};

const paintFinish = (context: Canvas2DContext, design: CardDesign, width: number, height: number) => {
  const [from, to] = design.face;
  const gradient = context.createLinearGradient(0, 0, width, height);

  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  context.fillStyle = gradient;
  context.globalAlpha = design.finish === "frosted" ? 0.55 : 1;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;

  if (design.finish === "metal") {
    // Brushed: fine streaks along the card, lighter and darker.
    const next = grain(7);

    for (let line = 0; line < 260; line += 1) {
      const y = next() * height;

      context.fillStyle = next() > 0.5 ? `rgba(255, 255, 255, ${0.03 + next() * 0.05})` : `rgba(0, 0, 0, ${0.03 + next() * 0.06})`;
      context.fillRect(0, y, width, 0.06 + next() * 0.1);
    }
  } else if (design.finish === "gloss") {
    // A printed sweep across the laminate.
    const sweep = context.createLinearGradient(0, height, width, 0);

    sweep.addColorStop(0, "rgba(255, 255, 255, 0)");
    sweep.addColorStop(0.55, "rgba(255, 255, 255, 0.08)");
    sweep.addColorStop(0.56, "rgba(255, 255, 255, 0)");
    context.fillStyle = sweep;
    context.fillRect(0, 0, width, height);
  } else if (design.finish === "matte") {
    const next = grain(11);

    for (let speck = 0; speck < 900; speck += 1) {
      context.fillStyle = `rgba(255, 255, 255, ${next() * 0.025})`;
      context.fillRect(next() * width, next() * height, 0.12, 0.12);
    }
  }
};

// The holder's portrait as a halftone: the picture sampled on a grid, each dot as large as that part is dark, fading
// out towards the card's middle, in the card's ink.
const paintPortrait = (context: Canvas2DContext, portrait: CanvasImageSource, ink: string, box: { x: number; y: number; width: number; height: number }) => {
  const columns = 30;
  const rows = 36;
  const sample = createDrawableSurface(columns, rows);

  if (!sample || !("getImageData" in sample.context)) {
    return;
  }

  try {
    sample.context.drawImage(portrait, 0, 0, columns, rows);

    const pixels = sample.context.getImageData(0, 0, columns, rows).data;
    const cell = box.width / columns;

    context.fillStyle = ink;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const at = (row * columns + column) * 4;
        const light = (0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2]) / 255;
        // Fainter towards its sides, so the portrait melts into the print.
        const fade = Math.min(1, column / (columns * 0.3), (columns - 1 - column) / (columns * 0.3));
        const radius = cell * 0.58 * Math.sqrt(Math.max(0, 1 - light)) * fade;

        if (radius > 0.02) {
          context.beginPath();
          context.arc(box.x + (column + 0.5) * cell, box.y + (row + 0.5) * cell, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
  } catch {
    // A picture that cannot be read (from another origin) leaves the card plain.
  }
};

const paintChip = (context: Canvas2DContext, x: number, y: number) => {
  const gold = context.createLinearGradient(x, y, x + 9, y + 7);

  gold.addColorStop(0, "#f2d892");
  gold.addColorStop(0.5, "#c9a24a");
  gold.addColorStop(1, "#a07a2a");
  context.fillStyle = gold;
  roundRect(context, x, y, 9, 7, 1.4);
  context.fill();
  context.strokeStyle = "rgba(90, 64, 16, 0.55)";
  context.lineWidth = 0.35;
  context.beginPath();
  [3, 6].forEach((offset) => {
    context.moveTo(x + offset, y);
    context.lineTo(x + offset, y + 7);
  });
  context.moveTo(x, y + 3.5);
  context.lineTo(x + 9, y + 3.5);
  context.stroke();
};

const paintContactless = (context: Canvas2DContext, x: number, y: number, ink: string) => {
  context.save();
  context.strokeStyle = ink;
  context.globalAlpha = 0.8;
  context.lineWidth = 0.55;
  context.lineCap = "round";
  [1.4, 2.6, 3.8].forEach((radius) => {
    context.beginPath();
    context.arc(x - 2, y, radius, -0.75, 0.75);
    context.stroke();
  });
  context.restore();
};

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
      context.stroke(path);
    }
  });
  context.restore();
};

// The face, its top left at the origin, in card units.
export const paintCardFace = (context: Canvas2DContext, look: CheckoutLook, design: CardDesign) => {
  const width = CARD.long;
  const height = CARD.short;
  const isEtched = design.finish === "metal";

  context.save();
  roundRect(context, 0, 0, width, height, CARD.radius);
  context.clip();
  paintFinish(context, design, width, height);

  // The holder's portrait across the middle of the card, behind its print, where a hand at its edge leaves it seen.
  if (design.issuer === "portrait" && look.portrait) {
    paintPortrait(context, look.portrait, "rgba(40, 0, 6, 0.5)", { x: width * 0.22, y: -2, width: width * 0.5, height: height + 4 });
  }

  paintChip(context, 6.5, 13);
  paintContactless(context, 22, 16.5, design.ink);

  // The issuer's monogram at the top, its letter in a fine ring.
  context.strokeStyle = design.ink;
  context.fillStyle = design.ink;
  context.lineWidth = 0.4;
  context.beginPath();
  context.arc(9, 6.5, 3.2, 0, Math.PI * 2);
  context.stroke();
  context.font = `700 4.4px ${FONT}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("R", 9, 6.7);

  // The number's last four and the holder, etched (a darker cut with a lit edge) on metal, printed otherwise.
  const write = (text: string, x: number, y: number, size: number, weight: number) => {
    context.font = `${weight} ${size}px ${FONT}`;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";

    if (isEtched) {
      context.fillStyle = "rgba(255, 255, 255, 0.35)";
      context.fillText(text, x + 0.12, y + 0.12);
      context.fillStyle = "rgba(0, 0, 0, 0.45)";
      context.fillText(text, x, y);
    } else {
      context.fillStyle = design.ink;
      context.fillText(text, x, y);
    }
  };

  write(`•••• ${design.lastFour}`, 6.5, 28.5, 2.9, 500);
  write(design.holder, 6.5, 33.6, 2.3, 600);
  paintMark(context, look.mark, { x: width - 17, y: height - 11.5, width: 13, height: 8.5 });
  context.restore();
};

// The face painted large for a 3D card's picture.
export const paintCardPicture = (look: CheckoutLook, design: CardDesign) => {
  const surface = createDrawableSurface(CARD_PICTURE.width, CARD_PICTURE.height);

  if (!surface) {
    return null;
  }

  surface.context.scale(CARD_PICTURE.width / CARD.long, CARD_PICTURE.height / CARD.short);
  paintCardFace(surface.context, look, design);

  return surface.surface;
};

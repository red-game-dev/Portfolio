import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";
import { lerp } from "@/packages/math/easing";

import { DealerLook, DealerOutfit } from "./outfits";

export interface DealerPose {
  // Seconds since the dealer appeared, for breathing, sequins and the speaking sway.
  time: number;
  isTalking: boolean;
  // 0 open to 1 closed.
  blink: number;
}

// The drawing is made in this box and scaled to the canvas.
export const DEALER_SIZE = { width: 200, height: 240 } as const;

const CX = 100;
// The head turns about the top of the neck.
const NECK_Y = 112;

export const DEALER_PIVOT = { x: CX, y: NECK_Y } as const;

// How far the lips part at each step of speech, for the three cached mouth shapes.
export const MOUTH_STEPS = [0, 1.4, 2.8] as const;

// The motion applied when the layers are drawn, so it never has to be painted into them.
export const dealerMotion = ({ time, isTalking }: DealerPose) => ({
  breath: Math.sin(time * 1.6) * 0.8,
  sway: isTalking ? Math.sin(time * 7) * 0.015 : Math.sin(time * 0.7) * 0.01,
});

// The mouth step for this moment: closed while she listens, cycling open and shut while she speaks.
export const mouthStep = ({ time, isTalking }: DealerPose): number => (isTalking ? Math.min(2, Math.floor((Math.sin(time * 18) + 1) * 1.5)) : 0);

const mouthOpening = (pose: DealerPose) => MOUTH_STEPS[mouthStep(pose)];

// Horizontal scales around the centre line: a slim figure, a fine oval face, hair fuller than both.
const BODY_WIDTH = 0.84;
const FACE_WIDTH = 0.93;
const HAIR_WIDTH = 0.92;

// A seeded scatter for the sequins, so they sit in the same places every frame.
const SPARKLES = Array.from({ length: 34 }, (_, index) => ({
  x: 52 + ((index * 53) % 96),
  y: 168 + ((index * 37) % 70),
  phase: (index * 0.73) % TAU,
}));

// The live dealer, painted with curves: long waves of hair, winged liner, red lips, earrings and a gown
// for the night. Pure drawing on any 2D context, so it can run on the page or offscreen.
export class DealerPainter {
  private readonly look: DealerLook;

  constructor(look: DealerLook) {
    this.look = look;
  }

  // Everything at once, live: for previews and tests. The page draws the cached layers instead.
  public paint(context: Canvas2DContext, outfit: DealerOutfit, pose: DealerPose): void {
    const { breath, sway } = dealerMotion(pose);

    context.save();
    context.translate(0, breath);
    this.paintBody(context, outfit, pose.time);
    context.restore();

    context.save();
    context.translate(CX, NECK_Y + breath * 1.2);
    context.rotate(sway);
    context.translate(-CX, -NECK_Y);
    this.paintHead(context, outfit, pose.blink, mouthOpening(pose));
    context.restore();
  }

  // The layer that moves with her breath: hair behind her, the figure, the gown, arms, deck and necklace.
  // `time` only matters for sequins.
  public paintBody(context: Canvas2DContext, outfit: DealerOutfit, time: number): void {
    context.save();
    this.narrow(context, HAIR_WIDTH);
    this.hairBack(context);
    context.restore();

    // A slim figure: the body is drawn on a narrower scale than the box.
    context.save();
    this.narrow(context, BODY_WIDTH);
    this.body(context);
    this.gown(context, outfit, time);
    this.arms(context, outfit);
    this.deck(context);
    this.necklace(context, outfit);
    context.restore();
  }

  // The layer that sways as she speaks: face, eyes, lips, earrings and the hair in front.
  public paintHead(context: Canvas2DContext, outfit: DealerOutfit, blink: number, mouth: number): void {
    context.save();
    context.translate(CX, 0);
    context.scale(FACE_WIDTH, 1);
    context.translate(-CX, 0);
    this.face(context);
    this.eyes(context, blink);
    this.mouth(context, mouth);
    this.earrings(context, outfit);
    this.hairFront(context);
    context.restore();
  }

  private narrow(context: Canvas2DContext, scale: number): void {
    context.translate(CX, 0);
    context.scale(scale, 1);
    context.translate(-CX, 0);
  }

  private gradient(context: Canvas2DContext, from: string, to: string, x0: number, y0: number, x1: number, y1: number) {
    const gradient = context.createLinearGradient(x0, y0, x1, y1);

    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);

    return gradient;
  }

  private hairBack(context: Canvas2DContext): void {
    const { hair, hairShine } = this.look;

    // Long, full waves behind her shoulders, wider than the face.
    context.beginPath();
    context.moveTo(CX, 24);
    context.bezierCurveTo(136, 22, 150, 62, 144, 96);
    context.bezierCurveTo(138, 118, 156, 132, 152, 156);
    context.bezierCurveTo(148, 176, 160, 190, 150, 206);
    context.bezierCurveTo(142, 216, 128, 212, 124, 200);
    context.lineTo(116, 120);
    context.lineTo(84, 120);
    context.lineTo(76, 200);
    context.bezierCurveTo(72, 212, 58, 216, 50, 206);
    context.bezierCurveTo(40, 190, 52, 176, 48, 156);
    context.bezierCurveTo(44, 132, 62, 118, 56, 96);
    context.bezierCurveTo(50, 62, 64, 22, CX, 24);
    context.closePath();
    context.fillStyle = this.gradient(context, hairShine, hair, 56, 24, 150, 210);
    context.fill();
  }

  private body(context: Canvas2DContext): void {
    const { skin, skinShade } = this.look;

    // Neck, slender.
    context.beginPath();
    context.moveTo(91, 104);
    context.lineTo(90, 134);
    context.quadraticCurveTo(CX, 141, 110, 134);
    context.lineTo(109, 104);
    context.closePath();
    context.fillStyle = this.gradient(context, skinShade, skin, CX, 104, CX, 128);
    context.fill();

    // Shoulders and chest, bare above the gown, narrowing to the waist.
    context.beginPath();
    context.moveTo(90, 128);
    context.bezierCurveTo(76, 134, 58, 137, 51, 149);
    context.bezierCurveTo(45, 162, 50, 204, 64, 240);
    context.lineTo(136, 240);
    context.bezierCurveTo(150, 204, 155, 162, 149, 149);
    context.bezierCurveTo(142, 137, 124, 134, 110, 128);
    context.closePath();
    context.fillStyle = skin;
    context.fill();

    // Collarbones, barely there.
    context.strokeStyle = skinShade;
    context.globalAlpha = 0.45;
    context.lineWidth = 0.9;
    context.beginPath();
    context.moveTo(78, 141);
    context.quadraticCurveTo(88, 139, 96, 143);
    context.moveTo(122, 141);
    context.quadraticCurveTo(112, 139, 104, 143);
    context.stroke();
    context.globalAlpha = 1;
  }

  private gown(context: Canvas2DContext, outfit: DealerOutfit, time: number): void {
    const fill = this.gradient(context, outfit.primary, outfit.shade, 40, 150, 160, 240);

    context.beginPath();

    if (outfit.cut === "sweetheart") {
      context.moveTo(50, 176);
      context.bezierCurveTo(54, 164, 62, 159, 70, 160);
      context.bezierCurveTo(84, 161, 94, 166, CX, 174);
      context.bezierCurveTo(106, 166, 116, 161, 130, 160);
      context.bezierCurveTo(138, 159, 146, 164, 150, 176);
      context.bezierCurveTo(152, 200, 140, 222, 137, 240);
      context.lineTo(63, 240);
      context.bezierCurveTo(60, 222, 48, 200, 50, 176);
    } else if (outfit.cut === "offShoulder") {
      context.moveTo(42, 166);
      context.bezierCurveTo(66, 158, 86, 161, CX, 167);
      context.bezierCurveTo(114, 161, 134, 158, 158, 166);
      context.bezierCurveTo(154, 196, 142, 222, 137, 240);
      context.lineTo(63, 240);
      context.bezierCurveTo(58, 222, 46, 196, 42, 166);
    } else if (outfit.cut === "halter") {
      context.moveTo(93, 127);
      context.lineTo(64, 166);
      context.bezierCurveTo(56, 196, 60, 222, 64, 240);
      context.lineTo(136, 240);
      context.bezierCurveTo(140, 222, 144, 196, 136, 166);
      context.lineTo(107, 127);
      context.lineTo(CX, 178);
    } else {
      this.shirt(context);
      context.beginPath();
      context.moveTo(56, 152);
      context.lineTo(90, 140);
      context.lineTo(CX, 196);
      context.lineTo(110, 140);
      context.lineTo(144, 152);
      context.bezierCurveTo(152, 190, 142, 220, 137, 240);
      context.lineTo(63, 240);
      context.bezierCurveTo(58, 220, 48, 190, 56, 152);
    }

    context.closePath();
    context.fillStyle = fill;
    context.fill();

    if (outfit.glow) {
      context.save();
      context.shadowColor = outfit.glow;
      context.shadowBlur = 10;
      context.strokeStyle = outfit.glow;
      context.lineWidth = 1.6;
      context.stroke();
      context.restore();
    }

    // A satin highlight down one side, and the sequins, both kept inside the gown.
    context.save();
    context.clip();
    context.globalAlpha = 0.35;
    context.fillStyle = this.gradient(context, outfit.sheen, "rgba(0, 0, 0, 0)", 70, 170, 96, 230);
    context.fillRect(40, 150, 120, 90);
    context.globalAlpha = 1;

    if (outfit.hasSparkle) {
      this.sparkle(context, time);
    }

    context.restore();

    if (outfit.cut === "waistcoat") {
      this.bowTie(context);
    }
  }

  private shirt(context: Canvas2DContext): void {
    context.beginPath();
    context.moveTo(89, 124);
    context.lineTo(111, 124);
    context.bezierCurveTo(126, 132, 146, 138, 150, 150);
    context.bezierCurveTo(155, 162, 150, 204, 136, 240);
    context.lineTo(64, 240);
    context.bezierCurveTo(50, 204, 45, 162, 50, 150);
    context.bezierCurveTo(54, 138, 74, 132, 89, 124);
    context.closePath();
    context.fillStyle = "#f4f4f6";
    context.fill();
  }

  private bowTie(context: Canvas2DContext): void {
    context.fillStyle = "#c0122f";
    context.beginPath();
    context.moveTo(CX, 132);
    context.lineTo(88, 126);
    context.lineTo(88, 138);
    context.closePath();
    context.moveTo(CX, 132);
    context.lineTo(112, 126);
    context.lineTo(112, 138);
    context.closePath();
    context.fill();
    context.beginPath();
    context.arc(CX, 132, 2.6, 0, TAU);
    context.fill();
  }

  private sparkle(context: Canvas2DContext, time: number): void {
    SPARKLES.forEach(({ x, y, phase }) => {
      const glint = (Math.sin(time * 3 + phase) + 1) / 2;

      context.globalAlpha = 0.25 + glint * 0.75;
      context.fillStyle = glint > 0.85 ? "#ffffff" : "#b9b9c6";
      context.fillRect(x, y, glint > 0.85 ? 2 : 1.2, glint > 0.85 ? 2 : 1.2);
    });
    context.globalAlpha = 1;
  }

  private arms(context: Canvas2DContext, outfit: DealerOutfit): void {
    const isSleeved = outfit.cut === "waistcoat";
    const sleeve = outfit.cut === "offShoulder" ? outfit.primary : null;

    [-1, 1].forEach((side) => {
      const x = (value: number) => CX + side * (value - CX);

      // Slender arms, elbows in, hands meeting over the deck.
      context.beginPath();
      context.moveTo(x(51), 150);
      context.bezierCurveTo(x(42), 170, x(41), 192, x(47), 208);
      context.lineTo(x(83), 234);
      context.lineTo(x(89), 226);
      context.lineTo(x(58), 203);
      context.bezierCurveTo(x(54), 190, x(55), 172, x(61), 158);
      context.closePath();
      // The waistcoat look wears a full white shirt sleeve; the gowns leave the arms bare.
      context.fillStyle = isSleeved ? this.gradient(context, "#ffffff", "#d8d8de", x(50), 150, x(60), 230)
        : this.gradient(context, this.look.skin, this.look.skinShade, x(50), 150, x(60), 230);
      context.fill();

      if (sleeve) {
        context.beginPath();
        context.moveTo(x(44), 160);
        context.bezierCurveTo(x(40), 172, x(40), 182, x(42), 190);
        context.lineTo(x(56), 188);
        context.bezierCurveTo(x(55), 178, x(56), 168, x(62), 160);
        context.closePath();
        context.fillStyle = sleeve;
        context.fill();
      }
    });
  }

  // The deck in her hands, fanned a little.
  private deck(context: Canvas2DContext): void {
    [-8, 0, 8].forEach((angle, index) => {
      context.save();
      context.translate(CX + (index - 1) * 5, 226);
      context.rotate((angle * Math.PI) / 180);
      context.fillStyle = "#f4efe6";
      context.fillRect(-9, -13, 18, 26);
      context.fillStyle = "#7a1022";
      context.fillRect(-7, -11, 14, 22);
      context.restore();
    });

    // Fingertips over the deck.
    context.fillStyle = this.look.skin;
    context.beginPath();
    context.ellipse(88, 230, 7, 5, -0.4, 0, TAU);
    context.ellipse(112, 230, 7, 5, 0.4, 0, TAU);
    context.fill();
  }

  private necklace(context: Canvas2DContext, outfit: DealerOutfit): void {
    if (outfit.cut === "waistcoat") {
      return;
    }

    context.strokeStyle = outfit.jewellery;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(89, 130);
    context.quadraticCurveTo(CX, 146, 111, 130);
    context.stroke();
    context.fillStyle = outfit.jewellery;
    context.beginPath();
    context.moveTo(CX, 142);
    context.lineTo(103, 146);
    context.lineTo(CX, 151);
    context.lineTo(97, 146);
    context.closePath();
    context.fill();
  }

  private face(context: Canvas2DContext): void {
    const { skin, skinShade } = this.look;

    context.beginPath();
    context.moveTo(CX, 44);
    context.bezierCurveTo(118, 44, 128, 58, 127, 78);
    context.bezierCurveTo(126, 96, 112, 111, CX, 116);
    context.bezierCurveTo(88, 111, 74, 96, 73, 78);
    context.bezierCurveTo(72, 58, 82, 44, CX, 44);
    context.closePath();

    const shade = context.createRadialGradient(CX, 76, 10, CX, 84, 40);

    shade.addColorStop(0, skin);
    shade.addColorStop(0.75, skin);
    shade.addColorStop(1, skinShade);
    context.fillStyle = shade;
    context.fill();

    // Blush high on the cheeks.
    [83, 117].forEach((x) => {
      const blush = context.createRadialGradient(x, 93, 1, x, 93, 9);

      blush.addColorStop(0, "rgba(232, 120, 130, 0.38)");
      blush.addColorStop(1, "rgba(232, 120, 130, 0)");
      context.fillStyle = blush;
      context.fillRect(x - 10, 83, 20, 20);
    });

    // The nose, a single soft line and a shadow under the tip.
    context.strokeStyle = skinShade;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(101, 85);
    context.quadraticCurveTo(102.5, 93, 99, 96.5);
    context.stroke();
    context.globalAlpha = 0.45;
    context.beginPath();
    context.ellipse(CX, 97.5, 3.2, 1.1, 0, 0, TAU);
    context.fillStyle = skinShade;
    context.fill();
    context.globalAlpha = 1;
  }

  private eyes(context: Canvas2DContext, blink: number): void {
    const { eyes, liner, hair } = this.look;

    [-1, 1].forEach((side) => {
      const cx = CX + side * 12;
      const outer = cx + side * 8;
      const inner = cx - side * 7;
      const open = 1 - blink;
      const lid = 82 - 6 * Math.max(open, 0.12);

      // A soft smoky shadow on the lid.
      const shadow = context.createRadialGradient(cx + side * 2, 79, 1, cx + side * 2, 79, 9);

      shadow.addColorStop(0, "rgba(120, 60, 70, 0.45)");
      shadow.addColorStop(1, "rgba(120, 60, 70, 0)");
      context.fillStyle = shadow;
      context.fillRect(cx - 11, 70, 22, 14);

      // Brows, arched and fine.
      context.strokeStyle = hair;
      context.lineWidth = 1.7;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(inner - side * 0.5, 72);
      context.quadraticCurveTo(cx + side * 2, 66, outer + side * 1.5, 70.5);
      context.stroke();

      if (open > 0.15) {
        // The eye, almond shaped and lifted at the outer corner.
        context.beginPath();
        context.moveTo(inner, 82);
        context.quadraticCurveTo(cx, lid, outer, 80.5);
        context.quadraticCurveTo(cx, 82 + 3.6 * open, inner, 82);
        context.closePath();
        context.fillStyle = "#fbf7f2";
        context.fill();
        context.save();
        context.clip();
        context.fillStyle = eyes;
        context.beginPath();
        context.arc(cx, 81, 3.5, 0, TAU);
        context.fill();
        context.fillStyle = liner;
        context.beginPath();
        context.arc(cx, 81, 1.6, 0, TAU);
        context.fill();
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(cx + 1, 79.8, 0.8, 0, TAU);
        context.fill();
        context.restore();
      }

      // Winged liner along the upper lid, and a few long lashes at the outer corner.
      context.strokeStyle = liner;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(inner, 82);
      context.quadraticCurveTo(cx, lid, outer, 80.5);
      context.quadraticCurveTo(outer + side * 2.5, 79.5, outer + side * 4.5, 77.5);
      context.stroke();
      context.lineWidth = 0.9;
      [0.62, 0.8, 0.94].forEach((t, index) => {
        const x = lerp(inner, outer, t);
        const y = 82 - (82 - lid) * (1 - (2 * t - 1) ** 2) - 0.4;

        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + side * 1.2, y - 2, x + side * (2 + index), y - 3);
        context.stroke();
      });
    });
    context.lineCap = "butt";
  }

  private mouth(context: Canvas2DContext, open: number): void {
    const { lips } = this.look;

    if (open > 0.3) {
      context.fillStyle = "#4a0d18";
      context.beginPath();
      context.ellipse(CX, 104 + open / 2, 6, open, 0, 0, TAU);
      context.fill();
    }

    // Upper lip, with its bow.
    context.fillStyle = lips;
    context.beginPath();
    context.moveTo(91, 103);
    context.bezierCurveTo(95, 100, 98, 100, CX, 101.6);
    context.bezierCurveTo(102, 100, 105, 100, 109, 103);
    context.bezierCurveTo(105, 104.4, 95, 104.4, 91, 103);
    context.fill();

    // Lower lip, fuller, with a gloss.
    context.beginPath();
    context.moveTo(91.5, 103.6 + open);
    context.bezierCurveTo(95, 108.6 + open, 105, 108.6 + open, 108.5, 103.6 + open);
    context.bezierCurveTo(104, 104.6 + open, 96, 104.6 + open, 91.5, 103.6 + open);
    context.fill();
    context.fillStyle = "rgba(255, 255, 255, 0.45)";
    context.beginPath();
    context.ellipse(102, 106 + open, 2.2, 0.8, 0, 0, TAU);
    context.fill();
  }

  private earrings(context: Canvas2DContext, outfit: DealerOutfit): void {
    [-1, 1].forEach((side) => {
      context.save();
      context.translate(CX + side * 28, 92);
      context.strokeStyle = outfit.jewellery;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(0, 8);
      context.stroke();
      context.fillStyle = outfit.jewellery;
      context.beginPath();
      context.moveTo(0, 8);
      context.lineTo(2.6, 12);
      context.lineTo(0, 16);
      context.lineTo(-2.6, 12);
      context.closePath();
      context.fill();
      context.restore();
    });
  }

  // A side parted crown with a sweep over the forehead, and one long wave falling over her shoulder.
  // A deep side part with a sweep over the forehead, and long waves falling over both shoulders.
  private hairFront(context: Canvas2DContext): void {
    const { hair, hairShine } = this.look;

    context.beginPath();
    context.moveTo(72, 90);
    context.bezierCurveTo(62, 40, 118, 20, 134, 58);
    context.bezierCurveTo(138, 70, 133, 84, 128, 92);
    context.bezierCurveTo(126, 72, 112, 58, 92, 60);
    context.bezierCurveTo(84, 62, 78, 74, 77, 92);
    context.closePath();
    context.fillStyle = this.gradient(context, hairShine, hair, 70, 30, 130, 96);
    context.fill();

    // The long wave over her left shoulder.
    context.beginPath();
    context.moveTo(73, 70);
    context.bezierCurveTo(64, 96, 76, 118, 66, 140);
    context.bezierCurveTo(58, 158, 72, 174, 64, 196);
    context.bezierCurveTo(60, 206, 66, 210, 70, 204);
    context.bezierCurveTo(80, 188, 72, 170, 76, 154);
    context.bezierCurveTo(80, 136, 84, 112, 79, 90);
    context.closePath();
    context.fillStyle = this.gradient(context, hairShine, hair, 60, 70, 82, 210);
    context.fill();

    // A shorter one on the right, tucked behind the shoulder.
    context.beginPath();
    context.moveTo(127, 72);
    context.bezierCurveTo(134, 96, 126, 116, 134, 134);
    context.bezierCurveTo(138, 146, 132, 156, 128, 160);
    context.bezierCurveTo(126, 146, 124, 132, 122, 118);
    context.bezierCurveTo(120, 104, 124, 90, 122, 84);
    context.closePath();
    context.fill();

    // Strands of shine.
    context.strokeStyle = "rgba(255, 220, 190, 0.22)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(86, 38);
    context.bezierCurveTo(104, 31, 122, 40, 128, 58);
    context.moveTo(71, 104);
    context.bezierCurveTo(66, 128, 74, 150, 67, 172);
    context.stroke();
  }
}

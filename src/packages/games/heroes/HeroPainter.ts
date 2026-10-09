import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";

import { HeroClass, HeroLook } from "./classes";

export const HERO_SIZE = { width: 200, height: 240 } as const;

const CX = 100;
// The head turns about the top of the neck.

export const HERO_PIVOT = { x: CX, y: 114 } as const;

const linear = (context: Canvas2DContext, from: string, to: string, x0: number, y0: number, x1: number, y1: number) => {
  const gradient = context.createLinearGradient(x0, y0, x1, y1);

  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);

  return gradient;
};

// An MMO hero bust, painted with curves: the same player in every class, with the armour, headgear and
// weapon of that class. Split into layers a rig can cache: the aura and cape behind, the body, the head,
// and the weapon in his hand.
export class HeroPainter {
  private readonly look: HeroLook;

  constructor(look: HeroLook) {
    this.look = look;
  }

  // The class's glow behind him, brighter as `glow` rises from 0 to 1. One gradient: cheap enough to paint
  // live every frame.
  public paintAura(context: Canvas2DContext, hero: HeroClass, glow: number): void {
    const aura = context.createRadialGradient(CX, 130, 10, CX, 130, 110);

    aura.addColorStop(0, `${hero.aura}${Math.round((0.28 + glow * 0.22) * 255).toString(16)
.padStart(2, "0")}`);
    aura.addColorStop(1, `${hero.aura}00`);
    context.fillStyle = aura;
    context.fillRect(0, 0, HERO_SIZE.width, HERO_SIZE.height);
  }

  public paintCape(context: Canvas2DContext, hero: HeroClass): void {
    if (hero.cape) {
      context.beginPath();
      context.moveTo(58, 146);
      context.bezierCurveTo(40, 180, 28, 214, 22, 240);
      context.lineTo(178, 240);
      context.bezierCurveTo(172, 214, 160, 180, 142, 146);
      context.closePath();
      context.fillStyle = linear(context, hero.cape, "#1a0508", CX, 146, CX, 240);
      context.fill();
    }
  }

  public paintBody(context: Canvas2DContext, hero: HeroClass): void {
    const { skin, skinShade } = this.look;

    // Neck.
    context.beginPath();
    context.moveTo(91, 104);
    context.lineTo(90, 136);
    context.quadraticCurveTo(CX, 142, 110, 136);
    context.lineTo(109, 104);
    context.closePath();
    context.fillStyle = linear(context, skinShade, skin, CX, 104, CX, 130);
    context.fill();

    // A slim, square shouldered torso under whatever he wears.
    context.beginPath();
    context.moveTo(90, 130);
    context.bezierCurveTo(74, 136, 52, 138, 44, 152);
    context.bezierCurveTo(38, 170, 40, 206, 46, 240);
    context.lineTo(154, 240);
    context.bezierCurveTo(160, 206, 162, 170, 156, 152);
    context.bezierCurveTo(148, 138, 126, 136, 110, 130);
    context.closePath();
    context.fillStyle = linear(context, hero.primary, hero.shade, 50, 140, 150, 240);
    context.fill();

    if (hero.cut === "plate" || hero.cut === "regal") {
      this.plate(context, hero);
    } else if (hero.cut === "robe") {
      this.robe(context, hero);
    } else if (hero.cut === "leather") {
      this.leather(context, hero);
    } else {
      this.cloak(context, hero);
    }

    // His left hand at his side; the right one belongs to the weapon layer.
    context.fillStyle = skin;
    context.beginPath();
    context.ellipse(52, 228, 7, 8, 0.2, 0, TAU);
    context.fill();
  }

  public paintHead(context: Canvas2DContext, hero: HeroClass, blink: number): void {
    if (hero.headgear === "hood") {
      this.hoodBack(context, hero);
    }

    this.face(context);
    this.eyes(context, blink);

    if (hero.headgear !== "hood") {
      this.hair(context);
    }

    this.headgear(context, hero);
  }

  // The weapon of the class in his right hand, its glow rising with `glow`.
  public paintProp(context: Canvas2DContext, hero: HeroClass, glow: number): void {
    const { skin } = this.look;
    const hand = { x: 152, y: 206 };

    context.save();
    this.prop(context, hero, hand, glow);
    context.restore();

    context.fillStyle = skin;
    context.beginPath();
    context.ellipse(hand.x, hand.y, 8, 8, 0, 0, TAU);
    context.fill();
  }

  private plate(context: Canvas2DContext, hero: HeroClass): void {
    // Pauldrons.
    [-1, 1].forEach((side) => {
      context.beginPath();
      context.ellipse(CX + side * 50, 152, 20, 13, side * 0.3, Math.PI, TAU);
      context.ellipse(CX + side * 50, 152, 20, 9, side * 0.3, 0, Math.PI);
      context.fillStyle = linear(context, hero.trim, hero.primary, CX + side * 40, 140, CX + side * 60, 165);
      context.fill();
      context.strokeStyle = hero.shade;
      context.lineWidth = 1.2;
      context.stroke();
    });

    // Breastplate with a centre ridge and a trimmed collar.
    context.strokeStyle = hero.trim;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(76, 148);
    context.quadraticCurveTo(CX, 160, 124, 148);
    context.moveTo(CX, 158);
    context.lineTo(CX, 236);
    context.stroke();
    context.globalAlpha = 0.25;
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.ellipse(84, 186, 10, 26, -0.15, 0, TAU);
    context.fill();
    context.globalAlpha = 1;

    if (hero.cut === "regal") {
      // A fur collar and a medallion.
      context.fillStyle = "#f6f1e6";
      context.beginPath();
      context.moveTo(62, 146);
      context.bezierCurveTo(80, 160, 120, 160, 138, 146);
      context.bezierCurveTo(130, 136, 70, 136, 62, 146);
      context.fill();
      context.fillStyle = "#2b2b2b";
      [70, 86, 114, 130].forEach((x) => context.fillRect(x, 147, 2, 3));
      context.fillStyle = hero.aura;
      context.beginPath();
      context.arc(CX, 178, 6, 0, TAU);
      context.fill();
      context.strokeStyle = hero.trim;
      context.lineWidth = 1.5;
      context.stroke();
    }
  }

  private robe(context: Canvas2DContext, hero: HeroClass): void {
    // A deep V collar edged in trim, with runes down the edges.
    context.fillStyle = hero.shade;
    context.beginPath();
    context.moveTo(86, 136);
    context.lineTo(CX, 186);
    context.lineTo(114, 136);
    context.closePath();
    context.fill();
    context.strokeStyle = hero.trim;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(84, 134);
    context.lineTo(CX, 190);
    context.lineTo(116, 134);
    context.moveTo(CX, 190);
    context.lineTo(CX, 240);
    context.stroke();
    context.lineWidth = 1;
    [200, 212, 224].forEach((y) => {
      context.beginPath();
      context.moveTo(CX - 6, y);
      context.lineTo(CX - 2, y - 4);
      context.lineTo(CX - 2, y + 4);
      context.moveTo(CX + 6, y);
      context.lineTo(CX + 2, y - 4);
      context.lineTo(CX + 2, y + 4);
      context.stroke();
    });
  }

  private leather(context: Canvas2DContext, hero: HeroClass): void {
    // A collar, a strap across the chest and a belt with a buckle.
    context.strokeStyle = hero.shade;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(62, 148);
    context.lineTo(140, 222);
    context.stroke();
    context.strokeStyle = hero.trim;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(62, 148);
    context.lineTo(140, 222);
    context.moveTo(80, 140);
    context.quadraticCurveTo(CX, 150, 120, 140);
    context.stroke();
    context.fillStyle = hero.trim;
    context.fillRect(92, 228, 16, 10);
  }

  private cloak(context: Canvas2DContext, hero: HeroClass): void {
    // A cloak over the shoulders, fastened with a clasp.
    context.fillStyle = linear(context, hero.primary, hero.shade, CX, 136, CX, 240);
    context.beginPath();
    context.moveTo(70, 134);
    context.bezierCurveTo(40, 146, 32, 196, 36, 240);
    context.lineTo(86, 240);
    context.lineTo(CX, 150);
    context.lineTo(114, 240);
    context.lineTo(164, 240);
    context.bezierCurveTo(168, 196, 160, 146, 130, 134);
    context.closePath();
    context.fill();
    context.fillStyle = hero.trim;
    context.beginPath();
    context.arc(CX, 150, 4.5, 0, TAU);
    context.fill();
  }

  private face(context: Canvas2DContext): void {
    const { skin, skinShade } = this.look;

    // Ears.
    context.fillStyle = skinShade;
    [-1, 1].forEach((side) => {
      context.beginPath();
      context.ellipse(CX + side * 26, 84, 4, 7, 0, 0, TAU);
      context.fill();
    });

    // A slim face with a clear jaw.
    context.beginPath();
    context.moveTo(CX, 46);
    context.bezierCurveTo(117, 46, 126, 58, 126, 78);
    context.bezierCurveTo(126, 94, 120, 106, 108, 113);
    context.quadraticCurveTo(CX, 118, 92, 113);
    context.bezierCurveTo(80, 106, 74, 94, 74, 78);
    context.bezierCurveTo(74, 58, 83, 46, CX, 46);
    context.closePath();

    const shade = context.createRadialGradient(CX, 76, 8, CX, 82, 40);

    shade.addColorStop(0, skin);
    shade.addColorStop(0.72, skin);
    shade.addColorStop(1, skinShade);
    context.fillStyle = shade;
    context.fill();

    // Nose and a quiet, confident smile.
    context.strokeStyle = skinShade;
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(101, 82);
    context.quadraticCurveTo(104, 93, 99, 97);
    context.stroke();
    context.strokeStyle = "#a45a50";
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(93, 104);
    context.quadraticCurveTo(CX + 1, 107, 108, 103);
    context.stroke();
  }

  private eyes(context: Canvas2DContext, blink: number): void {
    const { eyes, hair } = this.look;
    const open = 1 - blink;

    [-1, 1].forEach((side) => {
      const cx = CX + side * 11;

      // Straight, strong brows.
      context.strokeStyle = hair;
      context.lineWidth = 2.6;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(cx - side * 6, 71.5);
      context.lineTo(cx + side * 7, 70.5);
      context.stroke();
      context.lineCap = "butt";

      if (open > 0.15) {
        context.beginPath();
        context.ellipse(cx, 80, 5.5, 2.8 * open, 0, 0, TAU);
        context.fillStyle = "#fbf7f2";
        context.fill();
        context.fillStyle = eyes;
        context.beginPath();
        context.arc(cx, 80, 2.4 * Math.min(1, open + 0.2), 0, TAU);
        context.fill();
        context.fillStyle = "#ffffff";
        context.fillRect(cx + 0.6, 78.6, 1, 1);
      }

      context.strokeStyle = "#2a1a12";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(cx - 6, 80);
      context.quadraticCurveTo(cx, 80 - 4.2 * Math.max(open, 0.1), cx + 6, 79.5);
      context.stroke();
    });
  }

  // Short and swept back, with volume on top.
  private hair(context: Canvas2DContext): void {
    const { hair, hairShine } = this.look;

    context.beginPath();
    context.moveTo(74, 80);
    context.bezierCurveTo(68, 52, 78, 30, CX, 30);
    context.bezierCurveTo(124, 28, 134, 48, 127, 78);
    context.bezierCurveTo(126, 66, 122, 58, 116, 56);
    context.bezierCurveTo(108, 50, 92, 50, 84, 56);
    context.bezierCurveTo(78, 60, 76, 68, 74, 80);
    context.closePath();
    context.fillStyle = linear(context, hairShine, hair, 80, 28, 120, 70);
    context.fill();

    context.strokeStyle = "rgba(255, 230, 210, 0.18)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(88, 40);
    context.bezierCurveTo(98, 34, 112, 34, 122, 44);
    context.moveTo(84, 48);
    context.bezierCurveTo(96, 40, 112, 40, 124, 52);
    context.stroke();
  }

  private hoodBack(context: Canvas2DContext, hero: HeroClass): void {
    context.beginPath();
    context.moveTo(CX, 22);
    context.bezierCurveTo(142, 22, 150, 70, 140, 116);
    context.lineTo(60, 116);
    context.bezierCurveTo(50, 70, 58, 22, CX, 22);
    context.closePath();
    context.fillStyle = linear(context, hero.primary, hero.shade, CX, 22, CX, 116);
    context.fill();
  }

  private headgear(context: Canvas2DContext, hero: HeroClass): void {
    switch (hero.headgear) {
      case "crown": {
        context.beginPath();
        context.moveTo(78, 46);
        context.lineTo(80, 24);
        context.lineTo(89, 36);
        context.lineTo(CX, 18);
        context.lineTo(111, 36);
        context.lineTo(120, 24);
        context.lineTo(122, 46);
        context.closePath();
        context.fillStyle = linear(context, "#ffe58a", hero.primary, CX, 18, CX, 46);
        context.fill();
        context.strokeStyle = hero.shade;
        context.lineWidth = 1;
        context.stroke();
        [[CX, 34, hero.cape ?? hero.aura], [86, 40, hero.aura], [114, 40, hero.aura]].forEach(([x, y, colour]) => {
          context.fillStyle = colour as string;
          context.beginPath();
          context.arc(x as number, y as number, 2.6, 0, TAU);
          context.fill();
        });
        break;
      }
      case "hood": {
        // The hood's rim framing the face.
        context.strokeStyle = hero.shade;
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(70, 112);
        context.bezierCurveTo(64, 70, 74, 40, CX, 38);
        context.bezierCurveTo(126, 40, 136, 70, 130, 112);
        context.stroke();
        context.strokeStyle = hero.trim;
        context.lineWidth = 1.2;
        context.stroke();
        break;
      }
      case "featherCap": {
        context.fillStyle = linear(context, hero.primary, hero.shade, CX, 30, CX, 54);
        context.beginPath();
        context.ellipse(96, 44, 30, 12, -0.12, 0, TAU);
        context.fill();
        context.strokeStyle = hero.trim;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(70, 50);
        context.quadraticCurveTo(CX, 56, 124, 46);
        context.stroke();
        // The feather.
        context.fillStyle = hero.trim;
        context.beginPath();
        context.moveTo(118, 42);
        context.bezierCurveTo(138, 20, 150, 10, 156, 6);
        context.bezierCurveTo(150, 22, 136, 36, 120, 46);
        context.closePath();
        context.fill();
        break;
      }
      case "goggles": {
        context.strokeStyle = "#3a2a1a";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(74, 58);
        context.quadraticCurveTo(CX, 52, 126, 58);
        context.stroke();
        [-1, 1].forEach((side) => {
          context.beginPath();
          context.arc(CX + side * 11, 56, 7, 0, TAU);
          context.fillStyle = hero.trim;
          context.fill();
          context.beginPath();
          context.arc(CX + side * 11, 56, 4.5, 0, TAU);
          context.fillStyle = hero.aura;
          context.fill();
        });
        break;
      }
      case "circlet": {
        context.strokeStyle = hero.trim;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(75, 60);
        context.quadraticCurveTo(CX, 54, 125, 60);
        context.stroke();
        context.fillStyle = hero.aura;
        context.beginPath();
        context.moveTo(CX, 52);
        context.lineTo(104, 57);
        context.lineTo(CX, 62);
        context.lineTo(96, 57);
        context.closePath();
        context.fill();
        break;
      }
      default:
        break;
    }
  }

  private glowAt(context: Canvas2DContext, x: number, y: number, radius: number, colour: string, glow: number): void {
    const light = context.createRadialGradient(x, y, 1, x, y, radius);

    light.addColorStop(0, `${colour}ee`);
    light.addColorStop(0.4, `${colour}${Math.round((0.35 + glow * 0.4) * 255).toString(16)
.padStart(2, "0")}`);
    light.addColorStop(1, `${colour}00`);
    context.fillStyle = light;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  private prop(context: Canvas2DContext, hero: HeroClass, hand: { x: number; y: number }, glow: number): void {
    const { x, y } = hand;

    switch (hero.prop) {
      case "sceptre":
        context.fillStyle = linear(context, "#ffe58a", hero.shade, x - 3, 0, x + 3, 0);
        context.fillRect(x - 2.5, 112, 5, y - 108);
        this.glowAt(context, x, 104, 18, hero.aura, glow);
        context.fillStyle = hero.cape ?? hero.aura;
        context.beginPath();
        context.arc(x, 104, 6, 0, TAU);
        context.fill();
        context.strokeStyle = "#ffe58a";
        context.lineWidth = 2;
        context.stroke();
        break;
      case "staff":
        context.strokeStyle = "#6b4226";
        context.lineWidth = 5;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x, 240);
        context.lineTo(x - 2, 96);
        context.stroke();
        context.lineCap = "butt";
        this.glowAt(context, x - 2, 88, 24, hero.aura, glow);
        context.fillStyle = "#e9fbff";
        context.beginPath();
        context.arc(x - 2, 88, 7, 0, TAU);
        context.fill();
        break;
      case "quill":
        context.fillStyle = "#f4efe6";
        context.beginPath();
        context.moveTo(x + 2, y - 4);
        context.bezierCurveTo(x + 16, y - 50, x + 22, y - 80, x + 20, y - 100);
        context.bezierCurveTo(x + 8, y - 80, x - 2, y - 50, x - 2, y - 4);
        context.closePath();
        context.fill();
        context.strokeStyle = hero.trim;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y - 4);
        context.quadraticCurveTo(x + 12, y - 60, x + 20, y - 100);
        context.stroke();
        break;
      case "blueprint":
        context.save();
        context.translate(x - 4, y - 30);
        context.rotate(-0.2);
        context.fillStyle = "#16357a";
        context.fillRect(-16, -30, 32, 44);
        context.strokeStyle = `${hero.aura}${glow > 0.5 ? "ff" : "bb"}`;
        context.lineWidth = 1;
        context.strokeRect(-12, -26, 24, 36);
        context.beginPath();
        context.moveTo(-12, -8);
        context.lineTo(12, -8);
        context.moveTo(0, -26);
        context.lineTo(0, 10);
        context.moveTo(-8, 2);
        context.arc(-4, 2, 4, 0, TAU);
        context.stroke();
        context.fillStyle = "#e8e2d0";
        context.fillRect(-18, -34, 36, 5);
        context.fillRect(-18, 13, 36, 5);
        context.restore();
        break;
      case "gear":
        this.glowAt(context, x, y - 22, 22, hero.aura, glow);
        context.fillStyle = hero.trim;
        context.beginPath();
        for (let tooth = 0; tooth < 16; tooth += 1) {
          const angle = (tooth / 16) * TAU;
          const radius = tooth % 2 === 0 ? 14 : 11;

          context.lineTo(x + Math.cos(angle) * radius, y - 22 + Math.sin(angle) * radius);
        }
        context.closePath();
        context.fill();
        context.fillStyle = hero.shade;
        context.beginPath();
        context.arc(x, y - 22, 4.5, 0, TAU);
        context.fill();
        break;
      case "hexChain":
        [0, 1, 2, 3].forEach((link) => {
          const cy = y - 18 - link * 18;

          this.glowAt(context, x, cy, 12, hero.aura, glow);
          context.strokeStyle = hero.trim;
          context.lineWidth = 2;
          context.beginPath();
          for (let side = 0; side <= 6; side += 1) {
            const angle = (side / 6) * TAU + Math.PI / 6;

            context.lineTo(x + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
          }
          context.stroke();
        });
        break;
      case "sword":
        context.fillStyle = linear(context, "#f2f5fa", "#9aa3b2", x - 4, 0, x + 4, 0);
        context.beginPath();
        context.moveTo(x - 4, y - 12);
        context.lineTo(x - 4, 92);
        context.lineTo(x, 80);
        context.lineTo(x + 4, 92);
        context.lineTo(x + 4, y - 12);
        context.closePath();
        context.fill();
        context.fillStyle = hero.trim;
        context.fillRect(x - 14, y - 14, 28, 5);
        context.globalAlpha = glow;
        context.fillStyle = "#ffffff";
        context.fillRect(x - 1, 96, 2, 40);
        context.globalAlpha = 1;
        break;
      case "bow":
        context.strokeStyle = "#6b4226";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(x + 2, 96);
        context.quadraticCurveTo(x + 30, 160, x + 2, 236);
        context.stroke();
        context.strokeStyle = "#e8e2d0";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + 2, 96);
        context.lineTo(x + 2, 236);
        context.stroke();
        break;
      case "hammer":
        context.fillStyle = "#5a3a22";
        context.fillRect(x - 3, 120, 6, y - 114);
        context.fillStyle = linear(context, "#d9dde4", "#6b7280", x - 20, 100, x + 20, 128);
        context.fillRect(x - 20, 102, 40, 24);
        this.glowAt(context, x, 114, 14, hero.aura, glow);
        context.fillStyle = hero.aura;
        context.fillRect(x - 3, 110, 6, 8);
        break;
      case "gauntlet":
        this.glowAt(context, x, y - 8, 30, hero.aura, glow);
        context.fillStyle = hero.aura;
        [0, 1, 2].forEach((flame) => {
          const fx = x - 8 + flame * 8;

          context.beginPath();
          context.moveTo(fx - 4, y - 10);
          context.quadraticCurveTo(fx, y - 34 - glow * 10 - flame * 4, fx + 4, y - 10);
          context.closePath();
          context.fill();
        });
        context.fillStyle = hero.trim;
        context.fillRect(x - 10, y - 4, 20, 14);
        break;
      default:
        break;
    }
  }
}

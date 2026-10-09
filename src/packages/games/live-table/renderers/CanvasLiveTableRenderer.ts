import { Canvas2DContext, CanvasRenderer } from "@/packages/graphics/canvas";
import { TAU } from "@/packages/math/angles";
import { lerp } from "@/packages/math/easing";

import { LiveTableConfig, LiveTableTheme } from "../config";
import { LiveTableRenderer, LiveTableScene, LiveTableSize } from "../domain/types";

interface Point {
  x: number;
  y: number;
}

const CARD = { width: 20, height: 28, radius: 3 };
const CHIP_RADIUS = 7;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

const lerpPoint = (from: Point, to: Point, t: number): Point => ({ x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) });

// The felt under the cards: the table's curve with its rim, the other players around it holding their cards
// face down, the cards they throw flying to their spots, and chips stacking up on every spot that has a bet.
// Nothing here is text: the cards you can read live in the page above the canvas.
export class CanvasLiveTableRenderer extends CanvasRenderer<LiveTableScene> implements LiveTableRenderer {
  private readonly config: LiveTableConfig;
  private readonly theme: LiveTableTheme;

  constructor(context: Canvas2DContext, config: LiveTableConfig, theme: LiveTableTheme) {
    super(context);
    this.config = config;
    this.theme = theme;
  }

  public resize({ width, height }: LiveTableSize, pixelRatio: number): void {
    this.resizeSurface(width, height, Math.min(pixelRatio, this.config.maxPixelRatio));
  }

  public draw(scene: LiveTableScene): void {
    const { width, height } = this.size;

    if (width === 0 || height === 0) {
      return;
    }

    this.clear();
    this.drawFelt();

    scene.opponents.forEach((opponent) => {
      const seat = this.seatAt(opponent.seat);
      const spot = this.spotFor(seat);
      const landed = scene.throws.filter((thrown) => thrown.seat === opponent.seat && scene.now - thrown.thrownAt >= this.config.throwMs);

      this.drawSpot(spot);
      this.drawChips(spot, landed.length);
      landed.forEach((_, index) => this.drawCardBack({ x: spot.x + index * 3, y: spot.y - 14 - index * 2 }, (index % 2 === 0 ? -1 : 1) * 0.12));
      this.drawFan(seat, opponent.cardsLeft);
    });

    // Cards still in the air, on top of everything else.
    scene.throws.forEach((thrown) => {
      const t = (scene.now - thrown.thrownAt) / this.config.throwMs;

      if (t >= 1) {
        return;
      }

      const seat = this.seatAt(thrown.seat);
      const position = lerpPoint(seat, this.spotFor(seat), easeOut(t));

      this.drawCardBack({ x: position.x, y: position.y - Math.sin(t * Math.PI) * 30 }, t * TAU);
    });

    const you = this.yourSpot();

    this.drawSpot(you);
    this.drawChips(you, scene.playedCount);
  }

  // The table's curve: an ellipse hanging from the top edge, where the dealer stands.
  private table() {
    const { width, height } = this.size;

    return { cx: width / 2, cy: -height * 0.05, rx: width * 0.56, ry: height * 0.98 };
  }

  private drawFelt(): void {
    const { context } = this;
    const { cx, cy, rx, ry } = this.table();
    const gradient = context.createRadialGradient(cx, cy + ry * 0.35, 10, cx, cy + ry * 0.35, Math.max(rx, ry));

    gradient.addColorStop(0, this.theme.felt);
    gradient.addColorStop(1, this.theme.feltEdge);
    context.save();
    context.beginPath();
    context.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    context.fillStyle = gradient;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = this.theme.rim;
    context.stroke();
    context.beginPath();
    context.ellipse(cx, cy, rx * 0.9, ry * 0.88, 0, 0.05 * Math.PI, 0.95 * Math.PI);
    context.lineWidth = 1;
    context.setLineDash([4, 6]);
    context.strokeStyle = this.theme.spot;
    context.stroke();
    context.restore();
  }

  // Other players sit around the curve, two on each side, leaving the bottom middle for you.
  private seatAt(seat: number): Point {
    const { cx, cy, rx, ry } = this.table();
    const count = this.config.opponents;
    const half = Math.ceil(count / 2);
    const isLeft = seat < half;
    const index = isLeft ? seat : seat - half;
    const side = isLeft ? half : count - half;
    const span = 0.26;
    const t = isLeft ? 0.92 - (index / Math.max(1, side)) * span : 0.08 + (index / Math.max(1, side)) * span;
    const angle = t * Math.PI;

    return { x: cx + Math.cos(angle) * rx * 0.86, y: cy + Math.sin(angle) * ry * 0.86 };
  }

  private spotFor(seat: Point): Point {
    const { cx } = this.table();

    return lerpPoint(seat, { x: cx, y: this.size.height * 0.45 }, 0.22);
  }

  private yourSpot(): Point {
    return { x: this.size.width / 2, y: this.size.height * 0.88 };
  }

  private drawSpot({ x, y }: Point): void {
    const { context } = this;

    context.beginPath();
    context.arc(x, y, 18, 0, TAU);
    context.lineWidth = 1.5;
    context.strokeStyle = this.theme.spot;
    context.stroke();
  }

  private drawChips({ x, y }: Point, count: number): void {
    const { context } = this;
    const stacks = Math.min(count, 12);

    for (let index = 0; index < stacks; index += 1) {
      const chipY = y + 6 - index * 3;

      context.beginPath();
      context.ellipse(x + 14, chipY, CHIP_RADIUS, CHIP_RADIUS * 0.45, 0, 0, TAU);
      context.fillStyle = this.theme.chips[index % this.theme.chips.length];
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = "rgba(255, 255, 255, 0.55)";
      context.stroke();
    }
  }

  // A hand held face down, fanned out.
  private drawFan(seat: Point, cards: number): void {
    const spread = 0.16;

    for (let index = 0; index < cards; index += 1) {
      const angle = (index - (cards - 1) / 2) * spread;

      this.drawCardBack({ x: seat.x + Math.sin(angle) * 10, y: seat.y + 6 }, angle);
    }
  }

  private drawCardBack({ x, y }: Point, angle: number): void {
    const { context, theme } = this;
    const { width, height, radius } = CARD;

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.roundRect(-width / 2, -height / 2, width, height, radius);
    context.fillStyle = theme.cardEdge;
    context.fill();
    context.beginPath();
    context.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, radius - 1);
    context.fillStyle = theme.cardBack;
    context.fill();
    context.strokeStyle = theme.cardBackPattern;
    context.lineWidth = 1;

    for (let line = -height; line < height; line += 5) {
      context.beginPath();
      context.moveTo(-width / 2 + 2, line);
      context.lineTo(width / 2 - 2, line + width);
      context.stroke();
    }

    context.restore();
  }
}

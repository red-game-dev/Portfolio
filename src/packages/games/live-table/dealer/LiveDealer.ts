import { FrameLoop, FrameScheduler } from "@/packages/animation/frame-loop";
import { Canvas2DContext, SpriteCache } from "@/packages/graphics/canvas";
import { RandomSource } from "@/packages/math/random";

import { DEALER_PIVOT, DEALER_SIZE, DealerPainter, dealerMotion, MOUTH_STEPS, mouthStep } from "./DealerPainter";
import { DEFAULT_DEALER_LOOK, DEFAULT_DEALER_OUTFITS, DealerLook, DealerOutfit } from "./outfits";

export interface LiveDealerOptions {
  look?: DealerLook;
  outfits?: DealerOutfit[];
  scheduler?: FrameScheduler;
  random?: RandomSource;
}

// Blinks come every few seconds and last a moment, drawn from three cached lid positions.
const BLINK_EVERY_MS = [2500, 5500] as const;
const BLINK_MS = 160;
const BLINK_STEPS = [0, 0.6, 1] as const;
// Sequins twinkle through this many cached frames.
const SPARKLE_FRAMES = 12;
const SPARKLE_FPS = 8;

// The dealer as a sprite: the painter's body and head are painted once per outfit, lid, mouth and sequin
// step into a SpriteCache at device resolution, and each frame only blits two images, breathing and
// swaying through transforms. Detail costs nothing per frame, so the same rig scales to a table of them.
export class LiveDealer extends FrameLoop {
  private readonly context: Canvas2DContext;
  private readonly painter: DealerPainter;
  private readonly outfits: DealerOutfit[];
  private readonly random: RandomSource;
  private readonly sprites: SpriteCache;
  private width = 0;
  private height = 0;
  private scale = 1;
  private elapsedMs = 0;
  private talkUntilMs = 0;
  private nextBlinkAtMs: number;
  private blinkStartedAtMs = -Infinity;
  private outfitIndex = 0;

  constructor(context: Canvas2DContext, { look = DEFAULT_DEALER_LOOK, outfits = DEFAULT_DEALER_OUTFITS, scheduler, random = Math.random }: LiveDealerOptions = {}) {
    super({ framesPerSecond: 30, scheduler });
    this.context = context;
    this.painter = new DealerPainter(look);
    this.outfits = outfits;
    this.random = random;
    this.sprites = new SpriteCache({ width: DEALER_SIZE.width, height: DEALER_SIZE.height, scale: 1 });
    this.nextBlinkAtMs = this.blinkDelay();
  }

  public get outfitCount(): number {
    return this.outfits.length;
  }

  public get outfit(): number {
    return this.outfitIndex;
  }

  // Sized by width; the height follows the drawing's own proportions.
  public resize(width: number, pixelRatio = 1): void {
    if (width <= 0) {
      return;
    }

    this.width = width;
    this.height = (width * DEALER_SIZE.height) / DEALER_SIZE.width;
    this.scale = (width / DEALER_SIZE.width) * pixelRatio;
    this.context.canvas.width = Math.ceil(DEALER_SIZE.width * this.scale);
    this.context.canvas.height = Math.ceil(DEALER_SIZE.height * this.scale);
    this.sprites.rescale(this.scale);
    this.render();
  }

  public setOutfit(index: number): void {
    this.outfitIndex = ((index % this.outfits.length) + this.outfits.length) % this.outfits.length;
    this.render();
  }

  public speak(durationMs: number): void {
    this.talkUntilMs = this.elapsedMs + durationMs;
  }

  // A still frame, for reduced motion or before the loop starts.
  public renderStill(): void {
    this.render();
  }

  protected update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    if (this.elapsedMs >= this.nextBlinkAtMs) {
      this.blinkStartedAtMs = this.elapsedMs;
      this.nextBlinkAtMs = this.elapsedMs + this.blinkDelay();
    }
  }

  protected render(): void {
    if (this.width === 0) {
      return;
    }

    const outfit = this.outfits[this.outfitIndex];
    const time = this.elapsedMs / 1000;
    const pose = { time, isTalking: this.elapsedMs < this.talkUntilMs, blink: 0 };
    const { breath, sway } = dealerMotion(pose);
    const blink = this.blinkStep();
    const mouth = mouthStep(pose);
    const sparkle = outfit.hasSparkle ? Math.floor(time * SPARKLE_FPS) % SPARKLE_FRAMES : 0;
    const body = this.sprites.get(`body:${outfit.id}:${sparkle}`, (context) => this.painter.paintBody(context, outfit, sparkle / SPARKLE_FPS));
    const head = this.sprites.get(`head:${outfit.id}:${blink}:${mouth}`, (context) => (
      this.painter.paintHead(context, outfit, BLINK_STEPS[blink], MOUTH_STEPS[mouth])
    ));
    const { context, scale } = this;
    const frameWidth = DEALER_SIZE.width * scale;
    const frameHeight = DEALER_SIZE.height * scale;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    if (body) {
      context.drawImage(body, 0, breath * scale, frameWidth, frameHeight);
    }

    if (head) {
      const pivotX = DEALER_PIVOT.x * scale;
      const pivotY = DEALER_PIVOT.y * scale;

      context.translate(pivotX, pivotY + breath * 1.2 * scale);
      context.rotate(sway);
      context.drawImage(head, -pivotX, -pivotY, frameWidth, frameHeight);
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // Which cached lid to show: open, half or closed, rising and falling across the blink.
  private blinkStep(): number {
    const t = (this.elapsedMs - this.blinkStartedAtMs) / BLINK_MS;

    if (t < 0 || t >= 1) {
      return 0;
    }

    const closed = 1 - Math.abs(t * 2 - 1);

    return closed > 0.75 ? 2 : closed > 0.25 ? 1 : 0;
  }

  private blinkDelay(): number {
    const [min, max] = BLINK_EVERY_MS;

    return min + this.random() * (max - min);
  }
}

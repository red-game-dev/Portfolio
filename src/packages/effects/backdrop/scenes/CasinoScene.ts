import { Canvas2DContext, createDrawableSurface, DrawableSurface } from "@/packages/graphics/canvas";
import { randomBetween, RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface CasinoSceneOptions {
  // The table's glow at the centre of the screen.
  felt: string;
  chipColors: string[];
  suitColor: string;
  wheelColor: string;
  intensity: number;
}

interface Drifter {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
  // A chip colour index, or a suit index for suits.
  kind: number;
}

const CHIP_SPRITE = 48;
const SUITS = ["♠", "♥", "♦", "♣"];
const WHEEL_POCKETS = 37;
const AREA_PER_CHIP = 60000;

const paintChip = (context: Canvas2DContext, size: number, color: string) => {
  const centre = size / 2;
  const radius = size / 2 - 1;

  context.fillStyle = color;
  context.beginPath();
  context.arc(centre, centre, radius, 0, Math.PI * 2);
  context.fill();
  // The edge spots every casino chip has.
  context.strokeStyle = "rgba(255, 255, 255, 0.85)";
  context.lineWidth = size * 0.09;
  context.setLineDash([size * 0.16, size * 0.16]);
  context.beginPath();
  context.arc(centre, centre, radius * 0.82, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "rgba(0, 0, 0, 0.25)";
  context.beginPath();
  context.arc(centre, centre, radius * 0.5, 0, Math.PI * 2);
  context.fill();
};

const paintWheel = (context: Canvas2DContext, size: number, color: string) => {
  const centre = size / 2;

  context.strokeStyle = color;
  context.lineWidth = Math.max(1, size * 0.006);
  context.beginPath();
  context.arc(centre, centre, size * 0.48, 0, Math.PI * 2);
  context.arc(centre, centre, size * 0.36, 0, Math.PI * 2);
  context.arc(centre, centre, size * 0.12, 0, Math.PI * 2);

  for (let pocket = 0; pocket < WHEEL_POCKETS; pocket += 1) {
    const angle = (pocket / WHEEL_POCKETS) * Math.PI * 2;

    context.moveTo(centre + Math.cos(angle) * size * 0.36, centre + Math.sin(angle) * size * 0.36);
    context.lineTo(centre + Math.cos(angle) * size * 0.48, centre + Math.sin(angle) * size * 0.48);
  }

  context.stroke();
};

// A casino floor after dark: a felt glow, chips spinning as they drift up, card suits, and a roulette wheel
// turning slowly in the corner. Everything is drawn from sprites painted once per resize.
export class CasinoScene implements Scene {
  public readonly id = "casino";
  private readonly random: RandomSource;
  private readonly options: CasinoSceneOptions;
  private chips: Drifter[] = [];
  private suits: Drifter[] = [];
  private chipSprites: Array<DrawableSurface | null> = [];
  private suitSprites: Array<DrawableSurface | null> = [];
  private feltSprite: DrawableSurface | null = null;
  private wheelSprite: DrawableSurface | null = null;
  private width = 0;
  private height = 0;
  private spin = 0;

  constructor(random: RandomSource, options: CasinoSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height, pixelRatio }: SceneSize): void {
    const chipCount = Math.round(Math.min(22, Math.max(8, (width * height) / AREA_PER_CHIP)));

    this.width = width;
    this.height = height;
    this.chips = Array.from({ length: chipCount }, () => this.createDrifter(randomBetween(this.random, 0, height), this.options.chipColors.length));
    this.suits = Array.from({ length: Math.round(chipCount / 2) }, () => this.createDrifter(randomBetween(this.random, 0, height), SUITS.length));
    this.chipSprites = this.options.chipColors.map((color) => this.paint(CHIP_SPRITE, pixelRatio, (context, size) => paintChip(context, size, color)));
    this.suitSprites = SUITS.map((suit) => this.paint(32, pixelRatio, (context, size) => {
      context.fillStyle = this.options.suitColor;
      context.font = `${size * 0.8}px serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(suit, size / 2, size / 2);
    }));
    this.feltSprite = this.paint(64, 1, (context, size) => {
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

      gradient.addColorStop(0, this.options.felt);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    });
    this.wheelSprite = this.paint(Math.round(Math.min(width, height) * 0.7), pixelRatio, (context, size) => paintWheel(context, size, this.options.wheelColor));
  }

  public update(deltaMs: number): void {
    this.spin += deltaMs * 0.00006;
    [this.chips, this.suits].forEach((drifters, group) => drifters.forEach((drifter, index) => {
      drifter.y -= drifter.speed * deltaMs;
      drifter.phase += deltaMs * 0.0012;

      if (drifter.y < -drifter.size * 2) {
        drifters[index] = this.createDrifter(this.height + drifter.size * 2, group === 0 ? this.options.chipColors.length : SUITS.length);
      }
    }));
  }

  public draw(context: Canvas2DContext, alpha: number): void {
    const strength = alpha * this.options.intensity;

    if (this.feltSprite) {
      context.globalAlpha = strength;
      context.drawImage(this.feltSprite.surface, -this.width * 0.1, -this.height * 0.1, this.width * 1.2, this.height * 1.2);
    }

    if (this.wheelSprite) {
      const size = Math.min(this.width, this.height) * 0.7;

      context.save();
      context.globalAlpha = strength * 0.7;
      context.translate(this.width * 0.92, this.height * 0.95);
      context.rotate(this.spin);
      context.drawImage(this.wheelSprite.surface, -size / 2, -size / 2, size, size);
      context.restore();
    }

    this.chips.forEach((chip) => {
      const sprite = this.chipSprites[chip.kind];
      // A chip spins on its axis: its width follows the cosine of its phase.
      const width = chip.size * Math.max(0.12, Math.abs(Math.cos(chip.phase)));

      if (sprite) {
        context.globalAlpha = strength * 0.6;
        context.drawImage(sprite.surface, chip.x - width / 2, chip.y - chip.size / 2, width, chip.size);
      }
    });

    this.suits.forEach((suit) => {
      const sprite = this.suitSprites[suit.kind];

      if (sprite) {
        context.globalAlpha = strength * (0.35 + 0.25 * Math.sin(suit.phase));
        context.drawImage(sprite.surface, suit.x - suit.size / 2, suit.y - suit.size / 2, suit.size, suit.size);
      }
    });

    context.globalAlpha = 1;
  }

  private createDrifter(y: number, kinds: number): Drifter {
    return {
      x: randomBetween(this.random, 0, this.width),
      y,
      speed: randomBetween(this.random, 0.008, 0.02),
      size: randomBetween(this.random, 18, 34),
      phase: randomBetween(this.random, 0, Math.PI * 2),
      kind: Math.floor(this.random() * Math.max(1, kinds)),
    };
  }

  private paint(size: number, pixelRatio: number, painter: (context: Canvas2DContext, size: number) => void): DrawableSurface | null {
    const pixels = Math.max(1, Math.ceil(size * pixelRatio));
    const drawable = createDrawableSurface(pixels, pixels);

    if (drawable) {
      painter(drawable.context, pixels);
    }

    return drawable;
  }
}

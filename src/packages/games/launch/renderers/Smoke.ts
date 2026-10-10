import { Canvas2DContext, SpriteCache } from "@/packages/graphics/canvas";
import { Rgb, rgba } from "@/packages/graphics/colour";

// Puffs alive at once at most: emitting past it reuses the oldest.
const CAPACITY = 160;
// A puff's sprite (units), and how many greys it is painted in, from soot to steam.
const PUFF = 64;
const SHADES = 8;
const PUFF_KEYS = Array.from({ length: SHADES }, (_, level) => `puff:${level}`);
const WARM_KEY = "puff:warm";

// A soft round puff in one colour, opaque at its heart and fading to nothing at its edge.
const paintPuff = (colour: Rgb) => (context: Canvas2DContext) => {
  const half = PUFF / 2;
  const puff = context.createRadialGradient(half, half, 0, half, half, half);

  puff.addColorStop(0, rgba(colour, 1));
  puff.addColorStop(1, rgba(colour, 0));
  context.fillStyle = puff;
  context.fillRect(0, 0, PUFF, PUFF);
};

interface Puff {
  isAlive: boolean;
  // Across the view from the rocket's line (pixels), and its height in the world (metres), so smoke left behind
  // stays where it was made as the camera climbs away.
  x: number;
  altitude: number;
  vx: number;
  climb: number;
  size: number;
  grow: number;
  age: number;
  life: number;
  // 0 a dark sooty puff, 1 a white steam one.
  whiteness: number;
}

// Steam and smoke from a pool made once: the cloud that boils out of the flame trench and the trail a rocket
// leaves in thick air. Each puff is a sprite painted once per grey and blitted, a warm one laid over it near the
// flame by night, so nothing is made per frame.
export class Smoke {
  private readonly puffs: Puff[] = Array.from({ length: CAPACITY }, () => ({
    isAlive: false, x: 0, altitude: 0, vx: 0, climb: 0, size: 0, grow: 0, age: 0, life: 1, whiteness: 1,
  }));
  private next = 0;
  private readonly sprites = new SpriteCache({ width: PUFF, height: PUFF, scale: 1, maxEntries: SHADES + 1 });
  private readonly painters = Array.from({ length: SHADES }, (_, level) => {
    const grey = Math.round((level / (SHADES - 1)) * 255);

    return paintPuff([grey, grey, grey]);
  });
  private readonly warmPainter = paintPuff([255, 170, 90]);

  public emit(x: number, altitude: number, vx: number, climb: number, size: number, grow: number, life: number, whiteness: number): void {
    const puff = this.puffs[this.next];

    this.next = (this.next + 1) % CAPACITY;
    puff.isAlive = true;
    puff.x = x;
    puff.altitude = altitude;
    puff.vx = vx;
    puff.climb = climb;
    puff.size = size;
    puff.grow = grow;
    puff.age = 0;
    puff.life = life;
    puff.whiteness = whiteness;
  }

  public step(seconds: number): void {
    this.puffs.forEach((puff) => {
      if (!puff.isAlive) {
        return;
      }

      puff.age += seconds;
      puff.isAlive = puff.age < puff.life;
      puff.x += puff.vx * seconds;
      puff.vx *= Math.exp(-seconds * 0.8);
      puff.altitude = Math.max(0, puff.altitude + puff.climb * seconds);
      puff.size += puff.grow * seconds;
    });
  }

  public clear(): void {
    this.puffs.forEach((puff) => {
      puff.isAlive = false;
    });
  }

  // Each puff where its height falls on screen, in the light of the sky, lit orange near the flame by night.
  public draw(context: Canvas2DContext, centre: number, toY: (altitude: number) => number, light: number, flame: { x: number; y: number; reach: number } | null): void {
    const alpha = context.globalAlpha;
    const warm = this.sprites.get(WARM_KEY, this.warmPainter);

    this.puffs.forEach((puff) => {
      if (!puff.isAlive) {
        return;
      }

      const x = centre + puff.x;
      const y = toY(puff.altitude);
      const fade = 1 - puff.age / puff.life;
      const shade = (70 + 175 * puff.whiteness) * (0.25 + 0.75 * light);
      const level = Math.min(SHADES - 1, Math.round((shade / 255) * (SHADES - 1)));
      const sprite = this.sprites.get(PUFF_KEYS[level], this.painters[level]);
      const glow = flame ? Math.max(0, 1 - Math.hypot(x - flame.x, y - flame.y) / flame.reach) * (1 - light * 0.7) : 0;

      if (!sprite) {
        return;
      }

      context.globalAlpha = alpha * 0.5 * fade;
      context.drawImage(sprite, x - puff.size, y - puff.size, puff.size * 2, puff.size * 2);

      if (warm && glow > 0.05) {
        context.globalAlpha = alpha * 0.5 * fade * glow;
        context.drawImage(warm, x - puff.size, y - puff.size, puff.size * 2, puff.size * 2);
      }
    });
    context.globalAlpha = alpha;
  }
}

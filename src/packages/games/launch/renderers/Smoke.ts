import { Canvas2DContext } from "@/packages/graphics/canvas";
import { rgba } from "@/packages/graphics/colour";

// Puffs alive at once at most: emitting past it reuses the oldest.
const CAPACITY = 160;

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

// Steam and smoke from a pool made once: the cloud that boils out of the flame trench, the trail a rocket leaves
// in thick air, and the wisps venting off a fuelled rocket. Nothing is made per frame.
export class Smoke {
  private readonly puffs: Puff[] = Array.from({ length: CAPACITY }, () => ({
    isAlive: false, x: 0, altitude: 0, vx: 0, climb: 0, size: 0, grow: 0, age: 0, life: 1, whiteness: 1,
  }));
  private next = 0;

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
    this.puffs.forEach((puff) => {
      if (!puff.isAlive) {
        return;
      }

      const x = centre + puff.x;
      const y = toY(puff.altitude);
      const fade = 1 - puff.age / puff.life;
      const base = 70 + 175 * puff.whiteness;
      const shade = Math.round(base * (0.25 + 0.75 * light));
      const glow = flame ? Math.max(0, 1 - Math.hypot(x - flame.x, y - flame.y) / flame.reach) * (1 - light * 0.7) : 0;
      const red = Math.min(255, Math.round(shade + glow * 190));
      const green = Math.min(255, Math.round(shade + glow * 110));
      const blue = Math.round(shade * (1 - glow * 0.4));
      const puffGradient = context.createRadialGradient(x, y, 0, x, y, puff.size);

      puffGradient.addColorStop(0, rgba([red, green, blue], 0.5 * fade));
      puffGradient.addColorStop(1, rgba([red, green, blue], 0));
      context.fillStyle = puffGradient;
      context.fillRect(x - puff.size, y - puff.size, puff.size * 2, puff.size * 2);
    });
  }
}

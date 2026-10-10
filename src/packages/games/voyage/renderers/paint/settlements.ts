import { Canvas2DContext } from "@/packages/graphics/canvas";
import { hexWithAlpha, shadeHex } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom } from "@/packages/math/random";

// One building of a city on the horizon: where along the view it stands and how wide and tall (shares of the
// view), and its shape: a dome, a spire, or a block of towers.
export interface Building {
  x: number;
  width: number;
  height: number;
  shape: "dome" | "spire" | "block";
}

// The colours a people builds in: walls, trim, and the light in their windows.
export type CityColours = readonly [string, string, string];

// A city along the horizon, the same each time for a spot: clusters to either side of where the ship comes down,
// the tallest near the middle of each, so the landing ground in front stays open.
export const planCity = (seed: number): Building[] => {
  const random = createSeededRandom(seed * 7 + 3);
  const buildings: Building[] = [];

  random();
  random();
  [0.18, 0.78].forEach((centre) => {
    const count = 5 + Math.floor(random() * 6);

    for (let index = 0; index < count; index += 1) {
      const spread = (random() - 0.5) * 0.3;
      const near = 1 - Math.abs(spread) / 0.15;
      const roll = random();

      buildings.push({
        x: centre + spread,
        width: 0.012 + random() * 0.03,
        height: (0.03 + random() * 0.07) * (0.5 + near * 0.6),
        shape: roll < 0.3 ? "dome" : roll < 0.6 ? "spire" : "block",
      });
    }
  });

  return buildings.sort((first, second) => second.height - first.height);
};

// The city drawn on the horizon line: walls shaded by the light, trim along their tops, and at night their windows
// lit in the people's own colour.
export const paintCity = (context: Canvas2DContext, buildings: readonly Building[], horizon: number, width: number, height: number, colours: CityColours,
  light: number): void => {
  const [walls, trim, glow] = colours;
  const ambient = 0.2 + 0.6 * light;
  const night = Math.max(0, 0.55 - light) / 0.55;

  buildings.forEach((building) => {
    const x = building.x * width;
    const wide = building.width * width;
    const tall = building.height * height;

    context.fillStyle = shadeHex(walls, ambient);
    context.beginPath();

    if (building.shape === "dome") {
      context.ellipse(x, horizon, wide, tall * 0.7, 0, Math.PI, TAU);
    } else if (building.shape === "spire") {
      context.moveTo(x - wide * 0.5, horizon);
      context.lineTo(x - wide * 0.12, horizon - tall * 0.8);
      context.lineTo(x, horizon - tall * 1.25);
      context.lineTo(x + wide * 0.12, horizon - tall * 0.8);
      context.lineTo(x + wide * 0.5, horizon);
    } else {
      context.rect(x - wide * 0.5, horizon - tall, wide, tall);
    }

    context.fill();
    context.fillStyle = shadeHex(trim, ambient);
    context.fillRect(x - wide * 0.15, horizon - tall * (building.shape === "spire" ? 1.25 : building.shape === "dome" ? 0.72 : 1.02), wide * 0.3, 2);

    if (night > 0) {
      context.fillStyle = hexWithAlpha(glow, 0.85 * night);

      for (let row = 1; row < 5; row += 1) {
        const windowY = horizon - tall * (row / 5) * (building.shape === "spire" ? 0.8 : 0.9);

        context.fillRect(x - wide * 0.2, windowY, wide * 0.12, 1.5);
        context.fillRect(x + wide * 0.08, windowY, wide * 0.12, 1.5);
      }
    }
  });
};

// A people firing on a craft from the ground: tracers rising from batteries along the city towards it, each
// flickering on and off out of step, and flak bursting round it.
export const paintGroundFire = (context: Canvas2DContext, buildings: readonly Building[], horizon: number, width: number, height: number, targetX: number,
  targetY: number, colour: string, now: number): void => {
  context.save();
  context.globalCompositeOperation = "lighter";
  context.lineWidth = 1.5;
  buildings.slice(0, 4).forEach((building, index) => {
    const phase = (now * 0.004 + index * 1.7) % 2;

    if (phase > 1.2) {
      return;
    }

    const fromX = building.x * width;
    const fromY = horizon - building.height * height;
    const reach = Math.min(1, phase / 0.6);
    const toX = fromX + (targetX - fromX) * reach + Math.sin(now * 0.01 + index) * 12;
    const toY = fromY + (targetY - fromY) * reach;
    const tracer = context.createLinearGradient(fromX, fromY, toX, toY);

    tracer.addColorStop(0, hexWithAlpha(colour, 0));
    tracer.addColorStop(1, hexWithAlpha(colour, 0.9));
    context.strokeStyle = tracer;
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
  });

  for (let burst = 0; burst < 3; burst += 1) {
    const life = (now * 0.0011 + burst / 3) % 1;
    const x = targetX + Math.sin(burst * 2.4 + Math.floor(now * 0.0011 + burst / 3)) * width * 0.12;
    const y = targetY + Math.cos(burst * 1.7 + Math.floor(now * 0.0011 + burst / 3)) * height * 0.08;
    const radius = 6 + life * 22;
    const flash = context.createRadialGradient(x, y, 0, x, y, radius);

    flash.addColorStop(0, `rgba(255, 236, 190, ${(0.8 * (1 - life)).toFixed(3)})`);
    flash.addColorStop(1, "rgba(255, 140, 60, 0)");
    context.fillStyle = flash;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  context.restore();
};

import { hexToRgb, mixRgb, Rgb, rgba, rgbCss, scaleRgb } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";
import { smoothstep } from "@/packages/math/easing";
import { createSeededRandom } from "@/packages/math/random";

import { Frame, Ground, Scene, SkyLight } from "../domain/types";
import { skyLight, sunColour } from "../utils/sky";
import { RELIEF, ridgeline } from "../utils/terrain";

// Samples across each layer of land, stars in the sky, and things scattered on the ground near by.
const SAMPLES = 72;
const STARS = 170;
const SCATTER = 38;
// How far across the view the sky's things can sit, from the middle to either edge.
const SPREAD = 0.42;
// How much of the air's colour each layer of land takes on with distance: far, middle, near.
const AERIAL: [number, number, number] = [0.6, 0.32, 0.08];

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

interface Scattered {
  x: number;
  depth: number;
  size: number;
  shape: number;
}

// Paints a world as seen standing on it: the sky for the sun's height and the air's colour (thinning to black as
// the eye climbs), the stars where the sky lets them through, the sun with its halo, planets and moons hanging in
// the sky lit from the sun's side, then the land in three layers that take on the air's colour with distance, and
// the ground near by in its own kind: open sea with the sun's glitter on it, dunes, craters, cracked ice, forest,
// boulders. The stars, lines of land and scattered things are made once per seed and only drawn after.
export class LandscapePainter {
  private readonly stars: Star[];
  private readonly lines = new Map<string, Float32Array>();
  private readonly scattered = new Map<string, Scattered[]>();

  constructor(seed = 1) {
    const random = createSeededRandom(seed * 31 + 7);

    random();
    random();
    this.stars = Array.from({ length: STARS }, () => ({ x: random(), y: random(), size: 0.4 + random() * 1.3, phase: random() * TAU }));
  }

  // Where an elevation (degrees) falls on the view: by the field of view, or with the whole sky spread from the
  // horizon to the top.
  public static heightOf({ horizon, height, fieldOfView, isWholeSky }: Frame, elevation: number): number {
    return isWholeSky ? horizon - horizon * clamp(elevation / 90, -1, 1) : horizon - elevation * (height / fieldOfView);
  }

  public paint(frame: Frame, scene: Scene): SkyLight {
    const sky = skyLight(scene.air, scene.sun?.elevation ?? -90, frame.density);

    frame.context.globalAlpha = frame.opacity ?? 1;

    this.paintSky(frame, sky, scene);
    this.paintStars(frame, sky);
    this.paintSun(frame, scene);
    this.paintBodies(frame, scene);
    this.paintLand(frame, sky, scene);

    return sky;
  }

  public paintSky(frame: Frame, sky: SkyLight, scene: Scene): void {
    const { context, width, height, horizon } = frame;

    const gradient = context.createLinearGradient(0, 0, 0, Math.max(1, horizon));

    gradient.addColorStop(0, rgbCss(sky.zenith));
    gradient.addColorStop(0.62, rgbCss(mixRgb(sky.zenith, sky.horizon, 0.45)));
    gradient.addColorStop(1, rgbCss(sky.horizon));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, Math.max(0, horizon));
    context.fillStyle = rgbCss(sky.horizon);
    context.fillRect(0, Math.max(0, horizon), width, height - Math.max(0, horizon));

    // Dusk: the sky glows on the side the sun is going down.
    if (sky.glowStrength > 0.02 && scene.sun) {
      const x = width * (0.5 + scene.sun.side * SPREAD);
      const y = LandscapePainter.heightOf(frame, Math.max(0, scene.sun.elevation));
      const reach = Math.max(width, height) * 0.75;
      const glow = context.createRadialGradient(x, y, 0, x, y, reach);

      glow.addColorStop(0, rgba(sky.glow, 0.75 * sky.glowStrength));
      glow.addColorStop(0.45, rgba(sky.glow, 0.22 * sky.glowStrength));
      glow.addColorStop(1, rgba(sky.glow, 0));
      context.fillStyle = glow;
      context.fillRect(0, 0, width, horizon + height * 0.05);
    }
  }

  public paintStars({ context, width, horizon, now, opacity = 1 }: Frame, sky: SkyLight): void {
    if (sky.stars < 0.03 || horizon <= 0) {
      return;
    }

    context.fillStyle = "#eef2ff";
    this.stars.forEach((star) => {
      const y = star.y * horizon;
      // Low stars are dimmed by the air in front of them, and all of them twinkle a little.
      const twinkle = 0.75 + 0.25 * Math.sin(now * 0.002 + star.phase);

      context.globalAlpha = opacity * sky.stars * twinkle * (0.35 + 0.65 * (1 - star.y));
      context.fillRect(star.x * width, y, star.size, star.size);
    });
    context.globalAlpha = opacity;
  }

  public paintSun(frame: Frame, scene: Scene): void {
    const { context, width, height, fieldOfView, density } = frame;
    const { sun, air } = scene;

    if (!sun || sun.elevation < -sun.radius * 2) {
      return;
    }

    const perDegree = height / fieldOfView;
    const x = width * (0.5 + sun.side * SPREAD);
    const y = LandscapePainter.heightOf(frame, sun.elevation);
    const radius = Math.max(2.2, sun.radius * perDegree);
    const colour = sunColour(sun.colour, air, sun.elevation, density);
    const haze = air ? air.haze * density : 0;
    const halo = context.createRadialGradient(x, y, 0, x, y, radius * (haze > 0.7 ? 14 : 9));

    halo.addColorStop(0, rgba(colour, haze > 0.7 ? 0.55 : 0.9));
    halo.addColorStop(0.15, rgba(colour, 0.35));
    halo.addColorStop(1, rgba(colour, 0));
    context.fillStyle = halo;
    context.fillRect(x - radius * 14, y - radius * 14, radius * 28, radius * 28);

    // Through thick cloud only a bright patch shows, never the disc.
    if (haze <= 0.7) {
      context.fillStyle = rgbCss(mixRgb(colour, [255, 255, 255], 0.55));
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fill();
    }
  }

  public paintBodies(frame: Frame, scene: Scene): void {
    const { context, width, height, horizon, fieldOfView, density, opacity = 1 } = frame;
    const perDegree = height / fieldOfView;
    const daylight = scene.air ? smoothstep(-4, 12, scene.sun?.elevation ?? -90) * scene.air.strength * density : 0;

    scene.bodies.forEach((body) => {
      const x = width * (0.5 + body.side * SPREAD);
      const y = LandscapePainter.heightOf(frame, body.elevation);
      const radius = Math.max(1.5, body.radius * perDegree);

      if (y - radius > horizon) {
        return;
      }

      // By day a body is washed out by the sky in front of it.
      context.globalAlpha = opacity * (1 - daylight * 0.55);

      if (body.hasRings) {
        context.strokeStyle = rgba(hexToRgb(body.colour), 0.55);
        context.lineWidth = Math.max(1, radius * 0.18);
        context.beginPath();
        context.ellipse(x, y, radius * 2.2, radius * 0.5, -0.25, 0, TAU);
        context.stroke();
      }

      const face = hexToRgb(body.colour);
      const lit = context.createLinearGradient(x - radius * body.lightSide, y, x + radius * body.lightSide, y);

      lit.addColorStop(0, rgbCss(scaleRgb(face, 0.12)));
      lit.addColorStop(clamp(1 - body.lit, 0.01, 0.99), rgbCss(scaleRgb(face, 0.18)));
      lit.addColorStop(1, rgbCss(face));
      context.fillStyle = lit;
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fill();
      context.globalAlpha = opacity;
    });
  }

  public paintLand(frame: Frame, sky: SkyLight, scene: Scene): void {
    const { context, width, height, horizon, drop, density } = frame;
    const { ground, air } = scene;
    const base = horizon + drop;

    if (base >= height + 2) {
      return;
    }

    const relief = RELIEF[ground.relief];
    const near = hexToRgb(ground.colour);
    const far = hexToRgb(ground.far);
    const thickness = air ? Math.min(1, air.strength * density + air.haze * 0.4) : 0;
    const light = 0.16 + 0.84 * sky.light;
    // At night the land takes on a little of the night sky's colour.
    const tone = (colour: Rgb, layer: number): Rgb => {
      const aerial = mixRgb(colour, sky.horizon, AERIAL[layer] * thickness);

      return mixRgb(scaleRgb(aerial, light), sky.zenith, (1 - sky.light) * 0.25);
    };

    if (ground.relief === "sea") {
      this.paintSea(frame, sky, scene, base, tone(near, 2), tone(far, 0));

      return;
    }

    [0, 1, 2].forEach((layer) => {
      const line = this.line(ground, layer);
      const lift = relief.heights[layer] * height;
      const top = base + layer * height * 0.012;
      const colour = tone(mixRgb(far, near, layer / 2), layer);

      context.fillStyle = rgbCss(colour);
      context.beginPath();
      context.moveTo(0, height);

      for (let index = 0; index < SAMPLES; index += 1) {
        context.lineTo((index / (SAMPLES - 1)) * width, top - line[index] * lift);
      }

      context.lineTo(width, height);
      context.closePath();
      context.fill();

      if (ground.relief === "forest" && layer > 0) {
        this.paintTrees(frame, line, top, lift, scaleRgb(colour, 0.7), layer);
      }
    });

    // The ground near by darkens towards the viewer's feet.
    const groundTop = base + height * 0.024;
    const shadow = context.createLinearGradient(0, groundTop, 0, height);

    shadow.addColorStop(0, "rgba(0, 0, 0, 0)");
    shadow.addColorStop(1, `rgba(0, 0, 0, ${0.35 * light})`);
    context.fillStyle = shadow;
    context.fillRect(0, groundTop, width, height - groundTop);

    this.paintNear(frame, scene, groundTop, tone(near, 2), light);
  }

  // Each line of land once per seed, kind and layer.
  private line(ground: Ground, layer: number): Float32Array {
    const key = `${ground.relief}:${ground.seed}:${layer}`;
    let line = this.lines.get(key);

    if (!line) {
      line = ridgeline(ground.relief, ground.seed, layer, SAMPLES);
      this.lines.set(key, line);
    }

    return line;
  }

  // Where things lie on the ground near by, once per seed: further ones higher up and smaller.
  private scatter(ground: Ground): Scattered[] {
    const key = `${ground.relief}:${ground.seed}`;
    let things = this.scattered.get(key);

    if (!things) {
      const random = createSeededRandom(ground.seed * 613 + 5);

      random();
      things = Array.from({ length: SCATTER }, () => ({ x: random(), depth: random() ** 1.6, size: 0.4 + random() * 0.6, shape: random() }));
      things.sort((first, second) => first.depth - second.depth);
      this.scattered.set(key, things);
    }

    return things;
  }

  private paintSea({ context, width, height, now }: Frame, sky: SkyLight, scene: Scene, base: number, deep: Rgb, far: Rgb): void {
    const water = context.createLinearGradient(0, base, 0, height);

    water.addColorStop(0, rgbCss(mixRgb(far, sky.horizon, 0.5)));
    water.addColorStop(1, rgbCss(deep));
    context.fillStyle = water;
    context.fillRect(0, base, width, height - base);

    // Swell: short strokes, closer together towards the horizon.
    context.strokeStyle = rgba(mixRgb(sky.horizon, [255, 255, 255], 0.3), 0.18 + 0.2 * sky.light);
    context.lineWidth = 1;

    for (let row = 1; row < 14; row += 1) {
      const depth = (row / 14) ** 2;
      const y = base + depth * (height - base);
      const offset = (now * 0.01 * (0.3 + depth)) % 40;

      context.beginPath();

      for (let x = -offset; x < width; x += 18 + depth * 40) {
        context.moveTo(x, y);
        context.lineTo(x + 6 + depth * 16, y);
      }

      context.stroke();
    }

    const { sun } = scene;

    // The sun's glitter: a path of bright flecks from the horizon to the viewer.
    if (sun && sun.elevation > -1 && sky.light > 0.2) {
      const x = width * (0.5 + sun.side * SPREAD);
      const glitter = sunColour(sun.colour, scene.air, sun.elevation);

      context.fillStyle = rgba(glitter, 0.6 * sky.light);

      for (let fleck = 0; fleck < 40; fleck += 1) {
        const depth = fleck / 40;
        const y = base + depth * depth * (height - base);
        const spread = (6 + depth * 60) * Math.sin(fleck * 12.9898 + now * 0.004);

        context.fillRect(x + spread, y, 2 + depth * 10, 1 + depth * 1.5);
      }
    }
  }

  private paintTrees({ context, width }: Frame, line: Float32Array, top: number, lift: number, colour: Rgb, layer: number): void {
    const size = layer === 1 ? 5 : 9;

    context.fillStyle = rgbCss(colour);

    for (let index = 0; index < SAMPLES; index += 1) {
      const x = (index / (SAMPLES - 1)) * width;
      const y = top - line[index] * lift;
      const tall = size * (0.7 + 0.6 * ((index * 7919) % 13) / 13);

      context.beginPath();
      context.moveTo(x - tall * 0.45, y + 1);
      context.lineTo(x, y - tall);
      context.lineTo(x + tall * 0.45, y + 1);
      context.closePath();
      context.fill();
    }
  }

  // The ground at the viewer's feet in its own kind, lit from the sun's side.
  private paintNear(frame: Frame, scene: Scene, top: number, colour: Rgb, light: number): void {
    const { context, width, height } = frame;
    const { ground, sun } = scene;
    const span = height - top;
    const sunSide = sun ? Math.sign(sun.side) || 1 : 1;
    const bright = rgbCss(mixRgb(colour, [255, 255, 255], 0.22 * light));
    const dark = rgbCss(scaleRgb(colour, 0.55));

    if (span <= 2) {
      return;
    }

    if (ground.relief === "dunes") {
      // Crests running across, lit on the sun's face and shadowed behind.
      for (let row = 0; row < 6; row += 1) {
        const depth = (row + 1) / 7;
        const y = top + depth * depth * span;
        const amplitude = 3 + depth * 14;

        context.strokeStyle = row % 2 === 0 ? bright : dark;
        context.lineWidth = 1 + depth * 2;
        context.beginPath();

        for (let x = 0; x <= width; x += 12) {
          context.lineTo(x, y + Math.sin(x * (0.012 + row * 0.003) + row * 1.7) * amplitude);
        }

        context.stroke();
      }
    } else if (ground.relief === "ice") {
      // Cracks across the ice, stained as they are on the icy moons.
      context.strokeStyle = rgba([150, 100, 70], 0.45);
      context.lineWidth = 1;
      this.scatter(ground).forEach(({ x, depth, shape }) => {
        const y = top + depth * span;

        context.beginPath();
        context.moveTo(x * width - 40 * shape, y);
        context.lineTo(x * width + 60 * shape, y + 6 * depth);
        context.stroke();
      });
    }

    const hasCraters = ground.relief === "craters";

    if (!hasCraters && !ground.hasRocks) {
      return;
    }

    this.scatter(ground).forEach(({ x, depth, size, shape }) => {
      const y = top + depth * span;
      const scale = 0.25 + depth * 1.5;

      if (hasCraters && shape < 0.6) {
        // A crater: a flattened bowl, its far rim lit if the sun is behind the viewer's side, its near rim dark.
        const rx = size * 26 * scale;
        const ry = rx * 0.28;

        context.fillStyle = dark;
        context.beginPath();
        context.ellipse(x * width, y, rx, ry, 0, 0, TAU);
        context.fill();
        context.strokeStyle = bright;
        context.lineWidth = Math.max(1, scale * 1.4);
        context.beginPath();
        context.ellipse(x * width, y, rx, ry, 0, sunSide > 0 ? Math.PI * 0.6 : -Math.PI * 0.4, sunSide > 0 ? Math.PI * 1.4 : Math.PI * 0.4);
        context.stroke();
      } else {
        // A boulder with its shadow cast away from the sun.
        const r = size * 5 * scale;

        context.fillStyle = `rgba(0, 0, 0, ${0.35 * light})`;
        context.beginPath();
        context.ellipse(x * width - sunSide * r * 1.2, y + r * 0.3, r * 1.4, r * 0.35, 0, 0, TAU);
        context.fill();
        context.fillStyle = dark;
        context.beginPath();
        context.ellipse(x * width, y, r, r * 0.7, 0, 0, TAU);
        context.fill();
        context.fillStyle = bright;
        context.beginPath();
        context.ellipse(x * width + sunSide * r * 0.3, y - r * 0.2, r * 0.55, r * 0.35, 0, 0, TAU);
        context.fill();
      }
    });
  }
}

import { Canvas2DContext } from "@/packages/graphics/canvas";
import { createSeededRandom, RandomSource } from "@/packages/math/random";

const TAU = Math.PI * 2;

type BodyPaint = (context: Canvas2DContext, c: number, r: number, random: RandomSource) => void;

const disc = (context: Canvas2DContext, x: number, y: number, r: number) => {
  context.beginPath();
  context.arc(x, y, r, 0, TAU);
};

const base = (context: Canvas2DContext, c: number, r: number, light: string, dark: string) => {
  const fill = context.createLinearGradient(c, c + r, c, c - r);

  fill.addColorStop(0, light);
  fill.addColorStop(1, dark);
  context.fillStyle = fill;
  context.fillRect(c - r, c - r, r * 2, r * 2);
};

// Soft patches of a colour, for seas, deserts and dust.
const patches = (context: Canvas2DContext, c: number, r: number, random: RandomSource, colour: string, count: number, size: number) => {
  context.fillStyle = colour;

  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    const reach = random() * r * 0.85;

    context.beginPath();
    context.ellipse(c + Math.cos(angle) * reach, c + Math.sin(angle) * reach, r * size * (0.5 + random()), r * size * (0.3 + random() * 0.6),
      random() * Math.PI, 0, TAU);
    context.fill();
  }
};

// Bands across a gas giant, each edge a slow wave.
const bands = (context: Canvas2DContext, c: number, r: number, random: RandomSource, colours: string[]) => {
  const count = colours.length;

  colours.forEach((colour, index) => {
    const top = c - r + (index / count) * r * 2;
    const height = (r * 2) / count + r * 0.02;
    const wave = r * 0.02 * (0.5 + random());

    context.fillStyle = colour;
    context.beginPath();
    context.moveTo(c - r, top);

    for (let x = -r; x <= r; x += r / 8) {
      context.lineTo(c + x, top + Math.sin((x / r) * 6 + index) * wave);
    }

    context.lineTo(c + r, top + height);
    context.lineTo(c - r, top + height);
    context.closePath();
    context.fill();
  });
};

// Lit from behind the ship (the Sun is below it), dark across the far side and at the rim, so every body
// reads as a sphere.
const shade = (context: Canvas2DContext, c: number, r: number) => {
  const light = context.createRadialGradient(c, c + r * 0.55, r * 0.05, c, c + r * 0.25, r * 1.3);

  light.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  light.addColorStop(0.45, "rgba(0, 0, 0, 0)");
  light.addColorStop(1, "rgba(0, 0, 0, 0.82)");
  context.fillStyle = light;
  disc(context, c, c, r);
  context.fill();
};

const atmosphere = (context: Canvas2DContext, c: number, r: number, colour: string) => {
  const rim = context.createRadialGradient(c, c, r * 0.94, c, c, r * 1.16);

  rim.addColorStop(0, "rgba(0, 0, 0, 0)");
  rim.addColorStop(0.35, colour);
  rim.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = rim;
  disc(context, c, c, r * 1.16);
  context.fill();
};

// A continent: a cluster of overlapping rounded blobs in one solid colour.
const continent = (context: Canvas2DContext, x: number, y: number, size: number, random: RandomSource) => {
  for (let index = 0; index < 8; index += 1) {
    const angle = random() * TAU;
    const reach = random() * size;

    context.beginPath();
    context.ellipse(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach * 0.7, size * (0.35 + random() * 0.4), size * (0.2 + random() * 0.25),
      random() * Math.PI, 0, TAU);
    context.fill();
  }
};

const BODIES: Record<string, { paint: BodyPaint; glow?: string }> = {
  earth: {
    glow: "rgba(110, 170, 255, 0.55)",
    paint: (context, c, r, random) => {
      base(context, c, r, "#2a6fd0", "#0d2a63");

      for (let index = 0; index < 6; index += 1) {
        context.fillStyle = index % 3 === 2 ? "#a88c5c" : "#3d7a45";
        continent(context, c + (random() - 0.5) * r * 1.6, c + (random() - 0.5) * r * 1.6, r * (0.18 + random() * 0.16), random);
      }

      context.fillStyle = "#f2f6ff";
      context.beginPath();
      context.ellipse(c, c - r * 0.93, r * 0.45, r * 0.12, 0, 0, TAU);
      context.fill();
      context.fillStyle = "rgba(255, 255, 255, 0.45)";

      for (let index = 0; index < 14; index += 1) {
        context.beginPath();
        context.ellipse(c + (random() - 0.5) * r * 1.8, c + (random() - 0.5) * r * 1.8, r * (0.12 + random() * 0.3), r * (0.025 + random() * 0.04),
          random() * 0.5 - 0.25, 0, TAU);
        context.fill();
      }
    },
  },
  moon: {
    paint: (context, c, r, random) => {
      base(context, c, r, "#b9b9b6", "#77777a");
      patches(context, c, r, random, "rgba(70, 70, 76, 0.45)", 5, 0.32);

      for (let index = 0; index < 16; index += 1) {
        const angle = random() * TAU;
        const reach = random() * r * 0.9;
        const size = r * (0.04 + random() * 0.1);
        const x = c + Math.cos(angle) * reach;
        const y = c + Math.sin(angle) * reach;

        context.fillStyle = "rgba(40, 40, 46, 0.4)";
        disc(context, x, y, size);
        context.fill();
        context.fillStyle = "rgba(255, 255, 255, 0.12)";
        disc(context, x, y + size * 0.25, size * 0.8);
        context.fill();
      }
    },
  },
  mars: {
    glow: "rgba(255, 140, 90, 0.35)",
    paint: (context, c, r, random) => {
      base(context, c, r, "#d8642a", "#8a2c0e");
      patches(context, c, r, random, "rgba(90, 30, 12, 0.5)", 7, 0.3);
      patches(context, c, r, random, "rgba(240, 150, 90, 0.25)", 4, 0.25);
      context.fillStyle = "rgba(255, 255, 255, 0.85)";
      context.beginPath();
      context.ellipse(c, c - r * 0.9, r * 0.38, r * 0.14, 0, 0, TAU);
      context.fill();
    },
  },
  jupiter: {
    paint: (context, c, r, random) => {
      bands(context, c, r, random, ["#cbb79a", "#e9dcc3", "#a8794e", "#e3d2b4", "#c08a5c", "#f0e5d0", "#9c6a44", "#dcc8a6", "#b8875e",
        "#ecdfc8", "#a87650", "#d9c4a0"]);
      context.fillStyle = "#c2553a";
      context.beginPath();
      context.ellipse(c + r * 0.32, c + r * 0.3, r * 0.27, r * 0.13, -0.08, 0, TAU);
      context.fill();
      context.strokeStyle = "rgba(255, 225, 200, 0.55)";
      context.lineWidth = r * 0.02;
      context.stroke();
    },
  },
  saturn: {
    paint: (context, c, r, random) => {
      bands(context, c, r, random, ["#e9d7a6", "#d2b27a", "#f2e4bf", "#c9a670", "#ead8ae", "#d8bb88", "#f0e1b8", "#c49f68"]);
    },
  },
  uranus: {
    glow: "rgba(150, 230, 240, 0.35)",
    paint: (context, c, r, random) => {
      base(context, c, r, "#b9eef1", "#5fb6c4");
      bands(context, c, r, random, ["rgba(255, 255, 255, 0.05)", "rgba(0, 0, 0, 0.04)", "rgba(255, 255, 255, 0.06)", "rgba(0, 0, 0, 0.05)"]);
    },
  },
  neptune: {
    glow: "rgba(90, 140, 255, 0.4)",
    paint: (context, c, r, random) => {
      base(context, c, r, "#4f82ec", "#1e3a99");
      context.strokeStyle = "rgba(255, 255, 255, 0.35)";
      context.lineWidth = r * 0.025;

      for (let index = 0; index < 4; index += 1) {
        const y = c - r * 0.5 + random() * r;

        context.beginPath();
        context.ellipse(c, y, r * (0.5 + random() * 0.4), r * 0.04, 0, Math.PI * 1.1, Math.PI * 1.9);
        context.stroke();
      }

      context.fillStyle = "rgba(15, 30, 90, 0.75)";
      context.beginPath();
      context.ellipse(c - r * 0.25, c + r * 0.2, r * 0.2, r * 0.11, 0.1, 0, TAU);
      context.fill();
    },
  },
  pluto: {
    paint: (context, c, r, random) => {
      base(context, c, r, "#d8c4a6", "#7d6650");
      patches(context, c, r, random, "rgba(110, 70, 45, 0.55)", 6, 0.3);
      // The bright heart.
      const x = c + r * 0.2;
      const y = c + r * 0.15;
      const size = r * 0.32;

      context.fillStyle = "#f6ece0";
      context.beginPath();
      context.moveTo(x, y + size);
      context.bezierCurveTo(x - size * 1.6, y + size * 0.1, x - size * 0.7, y - size * 1.1, x, y - size * 0.35);
      context.bezierCurveTo(x + size * 0.7, y - size * 1.1, x + size * 1.6, y + size * 0.1, x, y + size);
      context.fill();
    },
  },
};

export const BODY_IDS = Object.keys(BODIES);

// How much bigger than the body its picture is, for rings and atmosphere: Saturn's rings reach well past it.
export const bodyExtent = (id: string): { width: number; height: number } => (id === "saturn" ? { width: 4.6, height: 2.6 } : { width: 2.5, height: 2.5 });

// Saturn's rings, back or front half: tilted, banded, with the Cassini gap. Each band is a stroked arc, so the
// front half can be laid over the planet without cutting into it.
const RING_BANDS: Array<[number, number, string]> = [
  [1.24, 1.42, "rgba(170, 150, 110, 0.35)"],
  [1.42, 1.7, "rgba(214, 192, 146, 0.75)"],
  [1.7, 1.9, "rgba(232, 214, 170, 0.85)"],
  [1.98, 2.22, "rgba(200, 180, 140, 0.55)"],
];

const rings = (context: Canvas2DContext, r: number, half: "back" | "front") => {
  context.save();
  context.scale(1, 0.3);
  RING_BANDS.forEach(([inner, outer, colour]) => {
    context.strokeStyle = colour;
    context.lineWidth = (outer - inner) * r;
    context.beginPath();
    context.arc(0, 0, ((inner + outer) / 2) * r, half === "back" ? Math.PI : 0, half === "back" ? TAU : Math.PI);
    context.stroke();
  });
  context.restore();
};

// One body of the solar system, centred in a surface `width` by `height` device pixels across.
export const paintBody = (id: string) => (context: Canvas2DContext, width: number, height: number) => {
  const body = BODIES[id];

  if (!body) {
    return;
  }

  const extent = bodyExtent(id);
  const r = width / extent.width;
  const c = r * 1.25;
  const random = createSeededRandom(id.length * 977 + id.charCodeAt(0) * 31);

  context.save();
  context.translate(width / 2 - c, height / 2 - c);

  if (id === "saturn") {
    context.save();
    context.translate(c, c);
    context.rotate(-0.32);
    rings(context, r, "back");
    context.restore();
  }

  if (body.glow) {
    atmosphere(context, c, r, body.glow);
  }

  context.save();
  disc(context, c, c, r);
  context.clip();
  body.paint(context, c, r, random);
  shade(context, c, r);
  context.restore();

  if (id === "saturn") {
    context.save();
    context.translate(c, c);
    context.rotate(-0.32);
    rings(context, r, "front");
    context.restore();
  }

  context.restore();
};

// Room above Earth's curve for its glow, as a share of its radius.
export const EARTH_GLOW = 0.05;

// A continent: a cluster of overlapping rounded blobs in one solid colour, so its coast is irregular rather than
// an ellipse and the overlaps do not show.
const landmass = (context: Canvas2DContext, x: number, y: number, size: number, random: RandomSource) => {
  for (let index = 0; index < 9; index += 1) {
    const angle = random() * TAU;
    const reach = random() * size;

    context.beginPath();
    context.ellipse(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach * 0.45, size * (0.3 + random() * 0.4), size * (0.12 + random() * 0.18),
      random() * 0.6 - 0.3, 0, TAU);
    context.fill();
  }
};

// Earth's curve along the bottom of the screen at the start: `width` across, the top of a sphere of radius
// `radius` starting `EARTH_GLOW` radii down, all in device pixels. Deep ocean, green and tan land, thin cloud,
// darker towards the far edge, and the bright skin of the atmosphere along the curve.
export const paintEarthCap = (radius: number) => (context: Canvas2DContext, width: number, height: number) => {
  const cx = width / 2;
  const cy = radius * (1 + EARTH_GLOW);
  const top = cy - radius;
  const random = createSeededRandom(3);
  const ocean = context.createLinearGradient(0, top, 0, height);

  ocean.addColorStop(0, "#123b85");
  ocean.addColorStop(0.5, "#0f3274");
  ocean.addColorStop(1, "#0a2152");

  context.save();
  disc(context, cx, cy, radius);
  context.clip();
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 6; index += 1) {
    context.fillStyle = index % 3 === 2 ? "#a88c5c" : "#346840";
    landmass(context, random() * width, top + (0.25 + random() * 0.75) * (height - top), width * (0.05 + random() * 0.06), random);
  }

  context.fillStyle = "rgba(255, 255, 255, 0.28)";

  for (let index = 0; index < 40; index += 1) {
    context.beginPath();
    context.ellipse(random() * width, top + random() * (height - top), width * (0.015 + random() * 0.05), Math.max(1, height * (0.004 + random() * 0.01)),
      random() * 0.3 - 0.15, 0, TAU);
    context.fill();
  }

  // Seen at a slant towards the far edge, the surface darkens into the curve.
  const far = context.createLinearGradient(0, top, 0, top + (height - top) * 0.45);

  far.addColorStop(0, "rgba(2, 6, 20, 0.6)");
  far.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = far;
  context.fillRect(0, 0, width, height);
  context.restore();

  const glow = context.createRadialGradient(cx, cy, radius * 0.99, cx, cy, radius * (1 + EARTH_GLOW));

  glow.addColorStop(0, "rgba(140, 200, 255, 0.95)");
  glow.addColorStop(0.25, "rgba(80, 150, 255, 0.45)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  disc(context, cx, cy, radius * (1 + EARTH_GLOW));
  context.fill();
};

// The air round a body, from its surface to the top of its atmosphere, in its own tint: thick and bright for
// Earth, a faint haze for Mars and Pluto, a deep cloud deck for the giants. Centred in a square `width` across
// that spans the top of the air.
export const paintHalo = (tint: string, surfaceShare: number) => (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const halo = context.createRadialGradient(c, c, c * surfaceShare * 0.96, c, c, c);

  halo.addColorStop(0, tint);
  halo.addColorStop(0.35, tint.replace(/[\d.]+\)$/, "0.18)"));
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = halo;
  disc(context, c, c, c);
  context.fill();
};

// The tint each body's air shows, from close by and from inside.
export const AIR_TINT: Record<string, string> = {
  earth: "rgba(120, 180, 255, 0.55)",
  mars: "rgba(230, 150, 110, 0.3)",
  pluto: "rgba(170, 200, 255, 0.18)",
  jupiter: "rgba(220, 190, 150, 0.45)",
  saturn: "rgba(235, 215, 165, 0.42)",
  uranus: "rgba(170, 235, 240, 0.42)",
  neptune: "rgba(110, 150, 255, 0.45)",
};

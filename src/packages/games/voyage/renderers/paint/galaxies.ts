import { Canvas2DContext } from "@/packages/graphics/canvas";
import { hexWithAlpha } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { createSeededRandom, RandomSource } from "@/packages/math/random";

import { GalaxySpec } from "../../domain/universe";

// A galaxy seen from outside: a soft core, and for a spiral, arms of dots winding out round it, tilted by `tilt` and
// squashed by `lean` as a disc seen at an angle is.
const paintDisc = (context: Canvas2DContext, random: RandomSource, x: number, y: number, size: number, galaxy: GalaxySpec, lean: number): void => {
  context.save();
  context.translate(x, y);
  context.rotate(galaxy.tilt);
  context.scale(1, lean);

  const core = context.createRadialGradient(0, 0, 0, 0, 0, size * 0.35);

  core.addColorStop(0, hexWithAlpha(galaxy.core, 0.9));
  core.addColorStop(1, hexWithAlpha(galaxy.core, 0));
  context.fillStyle = core;
  context.beginPath();
  context.arc(0, 0, size * 0.35, 0, TAU);
  context.fill();

  const arms = Math.max(galaxy.armCount, galaxy.kind === "elliptical" ? 0 : 2);

  context.fillStyle = galaxy.arms;

  for (let arm = 0; arm < arms; arm += 1) {
    for (let step = 0; step < 220; step += 1) {
      const t = step / 220;
      // A logarithmic spiral, as real spiral arms are.
      const angle = arm * (TAU / arms) + t * 3.6;
      const radius = size * (0.12 + t * 0.88);
      const scatter = size * 0.06 * (random() - 0.5);

      context.globalAlpha = (1 - t) * 0.5 * random();
      context.fillRect(Math.cos(angle) * radius + scatter, Math.sin(angle) * radius + scatter, 1.4, 1.4);
    }
  }

  context.restore();
  context.globalAlpha = 1;
};

// The sky inside a galaxy, painted once: from inside a disc (a spiral, a barred spiral or a ring) a band of
// countless stars across the sky with a dark lane of dust down it and the bright core somewhere along it (long, for
// a barred spiral; with a faint arc of its ring); inside an elliptical, a gold glow of old stars all over with no
// band at all; inside an irregular, clouds of young stars scattered about; and from a dwarf, its great neighbour
// hanging huge in the sky. Far galaxies smudge the dark beyond.
export const paintGalaxySky = (galaxy: GalaxySpec, starColour: string) => (context: Canvas2DContext, width: number, height: number) => {
  const random = createSeededRandom(galaxy.seed + 7);

  random();
  random();

  if (galaxy.kind === "elliptical") {
    const glow = context.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);

    glow.addColorStop(0, hexWithAlpha(galaxy.core, 0.14));
    glow.addColorStop(1, hexWithAlpha(galaxy.core, 0.04));
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.fillStyle = galaxy.core;

    for (let index = 0; index < 1400; index += 1) {
      context.globalAlpha = 0.08 + random() * 0.22;
      context.fillRect(random() * width, random() * height, 1, 1);
    }
  } else if (galaxy.kind === "irregular") {
    for (let cloud = 0; cloud < 7; cloud += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = (0.08 + random() * 0.16) * width;
      const patch = context.createRadialGradient(x, y, 0, x, y, radius);

      patch.addColorStop(0, hexWithAlpha(cloud % 2 === 0 ? galaxy.arms : galaxy.core, 0.12));
      patch.addColorStop(1, hexWithAlpha(galaxy.arms, 0));
      context.fillStyle = patch;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  } else if (galaxy.kind === "dwarf") {
    // The great galaxy a dwarf circles, filling a corner of the sky.
    paintDisc(context, random, width * (0.25 + random() * 0.5), height * (0.2 + random() * 0.25), width * 0.42, { ...galaxy, kind: "spiral", armCount: 2 }, 0.45);
  } else {
    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(galaxy.tilt);

    const band = context.createLinearGradient(0, -height * 0.22, 0, height * 0.22);

    band.addColorStop(0, hexWithAlpha(galaxy.arms, 0));
    band.addColorStop(0.4, hexWithAlpha(galaxy.arms, 0.1));
    // The dust lane down the middle of the band.
    band.addColorStop(0.5, hexWithAlpha(galaxy.arms, 0.03));
    band.addColorStop(0.6, hexWithAlpha(galaxy.arms, 0.1));
    band.addColorStop(1, hexWithAlpha(galaxy.arms, 0));
    context.fillStyle = band;
    context.fillRect(-width, -height * 0.22, width * 2, height * 0.44);

    const along = (random() - 0.5) * width * 0.8;
    const bulge = context.createRadialGradient(along, 0, 0, along, 0, width * 0.22);

    bulge.addColorStop(0, hexWithAlpha(galaxy.core, 0.22));
    bulge.addColorStop(1, hexWithAlpha(galaxy.core, 0));
    context.fillStyle = bulge;
    context.save();
    context.translate(along, 0);
    context.scale(galaxy.kind === "barred" ? 2.2 : 1.2, 0.5);
    context.translate(-along, 0);
    context.fillRect(along - width * 0.22, -width * 0.22, width * 0.44, width * 0.44);
    context.restore();

    if (galaxy.kind === "ring") {
      context.strokeStyle = hexWithAlpha(galaxy.arms, 0.12);
      context.lineWidth = height * 0.03;
      context.beginPath();
      context.ellipse(along, 0, width * 0.7, height * 0.35, 0, Math.PI * 1.1, Math.PI * 1.9);
      context.stroke();
    }

    context.fillStyle = starColour;

    for (let index = 0; index < 900; index += 1) {
      const spread = (random() + random() + random() - 1.5) / 1.5;

      context.globalAlpha = 0.1 + random() * 0.25;
      context.fillRect((random() - 0.5) * width * 1.8, spread * height * 0.2, 1, 1);
    }

    context.restore();
  }

  // Far galaxies, small smudges in the dark.
  for (let far = 0; far < 3; far += 1) {
    paintDisc(context, random, random() * width, random() * height, width * (0.025 + random() * 0.03), { ...galaxy, tilt: random() * TAU, armCount: 2, kind: "spiral" },
      0.3 + random() * 0.6);
  }

  context.globalAlpha = 1;
};

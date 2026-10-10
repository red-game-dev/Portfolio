import type { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb, rgba, scaleRgb } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { wrap } from "@/packages/math/clamp";

import { GlobeDraw, GlobeRenderer, StarDraw } from "../domain/types";
import { blackbody } from "../utils/colour";
import { globeFrame } from "../utils/frame";

const isDrawable = (image: TexImageSource): image is Exclude<TexImageSource, ImageData> => typeof ImageData === "undefined" || !(image instanceof ImageData);

// Channels from 0 to 1, as the shaders take them, as a CSS colour.
const css = (colour: Rgb, alpha = 1) => rgba(scaleRgb(colour, 255), alpha);

// Globes without WebGL: the map's facing half drawn into the disc and scrolled as the body turns, shaded from
// its light, with a rim of air. Flatter than the GPU's, but every body still turns, has day and night, and
// keeps its colours; a body with no map is shaded in its palette.
export class CanvasGlobeRenderer implements GlobeRenderer {
  public readonly isGpu = false;
  public readonly available = true;
  private readonly maps = new Map<string, Exclude<TexImageSource, ImageData>>();

  public resize(): void {
    // Draws straight into the target, so there is nothing of its own to size.
  }

  public setDetail(): void {
    // Its globes are flat shaded already.
  }

  public setTexture(id: string, image: TexImageSource): void {
    if (isDrawable(image)) {
      this.maps.set(id, image);
    }
  }

  public hasTexture(id: string): boolean {
    return this.maps.has(id);
  }

  public drawGlobe(target: Canvas2DContext, { x, y, radius, look, pose, light }: GlobeDraw): void {
    const map = look.surface.map ? this.maps.get(look.surface.map) : undefined;

    target.save();
    target.beginPath();
    target.arc(x, y, radius, 0, TAU);
    target.clip();

    if (map && "width" in map && map.width > 0) {
      const width = Number(map.width);
      const height = Number(map.height);
      const left = (look.surface.centreLongitude ?? 0) - 180;
      const facing = (globeFrame(pose).spin * 180) / Math.PI;
      const start = wrap((facing - 90 - left) / 360, 1);
      const first = Math.min(0.5, 1 - start);

      target.drawImage(map, start * width, 0, first * width, height, x - radius, y - radius, (first / 0.5) * radius * 2, radius * 2);

      if (first < 0.5) {
        target.drawImage(map, 0, 0, (0.5 - first) * width, height, x - radius + (first / 0.5) * radius * 2, y - radius, ((0.5 - first) / 0.5) * radius * 2, radius * 2);
      }
    } else {
      const fill = target.createRadialGradient(x, y, 0, x, y, radius);

      fill.addColorStop(0, look.surface.palette[2]);
      fill.addColorStop(1, look.surface.palette[0]);
      target.fillStyle = fill;
      target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    // Night on the side away from the light.
    const lx = Math.cos(pose.lightAngle);
    const ly = Math.sin(pose.lightAngle);
    const shade = target.createLinearGradient(x + lx * radius, y + ly * radius, x - lx * radius, y - ly * radius);

    shade.addColorStop(0, `rgba(0, 0, 0, ${1 - light})`);
    shade.addColorStop(0.45, `rgba(0, 0, 0, ${Math.max(0.1, 1 - light)})`);
    shade.addColorStop(0.62, "rgba(0, 0, 0, 0.88)");
    shade.addColorStop(1, "rgba(0, 0, 0, 0.94)");
    target.fillStyle = shade;
    target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    target.restore();

    if (look.atmosphere) {
      const rim = target.createRadialGradient(x, y, radius * 0.92, x, y, radius * (1 + look.atmosphere.thickness));

      rim.addColorStop(0, "rgba(0, 0, 0, 0)");
      rim.addColorStop(0.35, look.atmosphere.colour);
      rim.addColorStop(1, "rgba(0, 0, 0, 0)");
      target.globalAlpha = look.atmosphere.density * light;
      target.fillStyle = rim;
      target.beginPath();
      target.arc(x, y, radius * (1 + look.atmosphere.thickness), 0, TAU);
      target.fill();
      target.globalAlpha = 1;
    }
  }

  public drawStar(target: Canvas2DContext, { x, y, radius, look }: StarDraw): void {
    const colour = blackbody(look.temperatureK);
    const reach = radius * (1 + look.corona * 1.4);
    const corona = target.createRadialGradient(x, y, radius * 0.9, x, y, reach);

    corona.addColorStop(0, css(colour, 0.7));
    corona.addColorStop(1, css(colour, 0));
    target.fillStyle = corona;
    target.beginPath();
    target.arc(x, y, reach, 0, TAU);
    target.fill();

    const disc = target.createRadialGradient(x, y, 0, x, y, radius);

    disc.addColorStop(0, "#ffffff");
    disc.addColorStop(0.7, css(colour));
    disc.addColorStop(1, css([colour[0] * 0.8, colour[1] * 0.6, colour[2] * 0.4]));
    target.fillStyle = disc;
    target.beginPath();
    target.arc(x, y, radius, 0, TAU);
    target.fill();
  }

  public dispose(): void {
    this.maps.clear();
  }
}

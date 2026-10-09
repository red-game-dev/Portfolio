import type { RenderLayer } from "@/packages/games/engine";
import { clamp01 } from "@/packages/math/clamp";

import { VoyageFrame } from "../frame";
import { paintMilkyWay, paintStars, paintSun, paintUniverse } from "../paint/space";
import { RenderKit } from "./kit";

// Each star layer: how fast it moves against the camera, the square it repeats in (CSS pixels), and where it
// starts, so no two layers repeat in step.
const STARS = [
  { depth: 0.04, tile: 520, shift: 0 },
  { depth: 0.12, tile: 760, shift: 290 },
  { depth: 0.3, tile: 1100, shift: 530 },
];
const BACKDROP_TILE = 720;
// Where the Sun sits in the world: behind Earth, out past the bottom of the way out.
const SUN = { x: 0, y: 60 };

// The sky: the deep colour of the region, the Milky Way, three layers of stars moving at their own depths as the
// camera crosses them, a universe's own backdrop, and the Sun's warmth from behind, fading with distance.
export class BackdropLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "backdrop";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, camera, universe, theme }: VoyageFrame): void {
    const { back } = this.kit;

    back.fill(state.phase === "lost" ? "#000000" : universe?.deep ?? theme.space);

    if (state.phase === "lost") {
      return;
    }

    const ratio = Math.min(1.5, back.pixelRatio);
    const base = camera.scale / camera.zoom;
    const milkyWay = this.kit.cache.get("milky-way", 512, 512, paintMilkyWay(theme.star));

    if (milkyWay) {
      back.context.drawImage(milkyWay.surface, 0, 0, back.width, back.height);
    }

    STARS.forEach(({ depth, tile, shift }, layer) => {
      const stars = this.kit.cache.get(`stars:${layer}`, tile * ratio, tile * ratio, paintStars(layer === 0 ? 0 : layer === 1 ? 1 : 2, theme.star, ratio));

      this.kit.tile(back, stars, tile, -camera.x * base * depth + shift, -camera.y * base * depth, 1);
    });

    if (universe) {
      const side = BACKDROP_TILE * ratio;
      const backdrop = this.kit.cache.get(`universe:${universe.style}`, side, side, paintUniverse(universe.style, universe.accent, ratio));
      const depth = universe.style === "matrix" ? 0.5 : 0.2;

      this.kit.tile(back, backdrop, BACKDROP_TILE, -camera.x * base * depth, -camera.y * base * depth + state.elapsedMs * (universe.style === "matrix" ? 0.06 : 0), 0.9);
    }

    if (state.phase === "solar" || state.phase === "singularity") {
      const { route } = state;
      const out = Math.hypot(camera.x - route.origin.x, camera.y - route.origin.y);
      const au = 1 + (route.lastAu - 1) * (out / route.length) ** 2;
      const angle = Math.atan2(SUN.y - camera.y, SUN.x - camera.x);
      const reach = Math.hypot(back.width, back.height) * 0.62;
      const radius = Math.max(back.width, back.height) * 0.9;
      const sun = this.kit.cache.get("sun", 256, 256, paintSun);

      back.context.globalAlpha = clamp01(1.1 / au);
      back.blit(sun, back.width / 2 + Math.cos(angle) * reach, back.height / 2 + Math.sin(angle) * reach, radius * 2, radius * 2);
      back.context.globalAlpha = 1;
    }
  }
}

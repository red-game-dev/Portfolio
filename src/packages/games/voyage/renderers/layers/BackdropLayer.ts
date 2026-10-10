import type { RenderLayer } from "@/packages/games/engine";
import { clamp01 } from "@/packages/math/clamp";

import { SystemStar } from "../../domain/content";
import { auForRadius } from "../../utils/scale";
import { VoyageFrame } from "../frame";
import { paintGalaxySky } from "../paint/galaxies";
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

// The sky: the deep colour of the region, the galaxy it lies in (our Milky Way at home, a universe's own galaxy
// beyond), three layers of stars moving at their own depths as the camera crosses them, a universe's own backdrop,
// and, while the star is out of sight, its glow from its direction, fading with distance.
export class BackdropLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "backdrop";
  // The galaxy sky painted for the universe the ship is in, let go of when it leaves for another.
  private skyKey: string | null = null;

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state, camera, universe, theme } = frame;
    const { back } = this.kit;

    back.fill(state.phase === "lost" ? "#000000" : universe?.deep ?? theme.space);

    if (state.phase === "lost") {
      return;
    }

    const ratio = Math.min(1.5, back.pixelRatio);
    const base = camera.scale / camera.zoom;
    const galaxy = state.cosmos?.galaxy;
    const skyKey = galaxy ? `galaxy:${galaxy.kind}:${galaxy.seed}` : null;

    if (skyKey !== this.skyKey && this.skyKey) {
      this.kit.cache.delete(this.skyKey);
    }

    this.skyKey = skyKey;

    const sky = galaxy && skyKey
      ? this.kit.cache.get(skyKey, 512, 512, paintGalaxySky(galaxy, theme.star))
      : this.kit.cache.get("milky-way", 512, 512, paintMilkyWay(theme.star));

    if (sky) {
      back.context.drawImage(sky.surface, 0, 0, back.width, back.height);
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

    this.glowFrom(frame, state.system.star);
    state.system.companions.forEach((other) => this.glowFrom(frame, other));
  }

  // A star out of sight still lights the sky from its direction, as bright as it looks from here: its light falls off
  // with the square of the distance, so a supergiant hundreds of AU away still glows like the Sun from Earth.
  private glowFrom({ state, camera }: VoyageFrame, star: SystemStar): void {
    const { back } = this.kit;

    if (star.luminosity <= 0) {
      return;
    }

    const out = Math.hypot(camera.x - star.x, camera.y - star.y);

    // Close enough to see the star itself, it needs no glow from off screen.
    if (out < star.radius * 3 + Math.hypot(back.width, back.height) / camera.scale) {
      return;
    }

    const au = auForRadius(state.system.scale, out);
    const angle = Math.atan2(star.y - camera.y, star.x - camera.x);
    const reach = Math.hypot(back.width, back.height) * 0.62;
    const radius = Math.max(back.width, back.height) * 0.9;
    const sun = this.kit.cache.get("sun", 256, 256, paintSun);

    back.context.globalAlpha = clamp01((1.1 * Math.sqrt(star.luminosity)) / au);
    back.blit(sun, back.width / 2 + Math.cos(angle) * reach, back.height / 2 + Math.sin(angle) * reach, radius * 2, radius * 2);
    back.context.globalAlpha = 1;
  }
}

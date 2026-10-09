import type { RenderLayer } from "@/packages/games/engine";

import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { paintHazard, paintPickup, paintRock } from "../paint/hazards";
import { RenderKit } from "./kit";

// The colour of each kind of pickup; score takes a universe's own colour there.
const PICKUP_COLOUR = { score: "#ffd76a", shield: "#4fd8ff", fuel: "#62ffc8", repair: "#ff8fa3" };

// What drifts through space: pickups pulsing softly, rocks tumbling (icy out past Neptune), and in the universes
// each one's own hazards. Only what the camera can see is drawn, each from a sprite painted once per size.
export class ThingsLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "things";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, world, camera, alpha, now, universe }: VoyageFrame): void {
    if (state.phase === "lost") {
      return;
    }

    const { front } = this.kit;
    const base = camera.scale / camera.zoom;
    const pulse = 1 + Math.sin(now * 0.006) * 0.12;

    world.stores.pickup.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);

      if (!body || !camera.sees(body.x, body.y, body.radius * 3)) {
        return;
      }

      const { kind } = world.stores.pickup.values[index];
      const colour = kind === "score" && universe ? universe.accent : PICKUP_COLOUR[kind];
      const size = sizeBucket(body.radius * 3 * base);
      const sprite = this.kit.sprite(`pickup:${kind}:${colour}:${size}`, size, size, paintPickup(kind, colour));
      const drawn = body.radius * 3 * camera.scale * pulse;

      front.blit(sprite, camera.toScreenX(lerpX(body, alpha)), camera.toScreenY(lerpY(body, alpha)), drawn, drawn);
    });

    world.stores.hazard.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);

      if (!body || !camera.sees(body.x, body.y, body.radius * 1.3)) {
        return;
      }

      const hazard = world.stores.hazard.values[index];
      const spin = world.stores.spin.get(entity)?.angle ?? 0;
      const size = sizeBucket(body.radius * 2.4 * base);
      const drawn = body.radius * 2.4 * camera.scale;
      const x = camera.toScreenX(lerpX(body, alpha));
      const y = camera.toScreenY(lerpY(body, alpha));

      if (!universe) {
        front.blit(this.kit.sprite(`rock:${hazard.shape}:${hazard.isIcy}:${size}`, size, size, paintRock(hazard.shape, hazard.isIcy)), x, y, drawn, drawn, spin);

        return;
      }

      const sprite = this.kit.sprite(`hazard:${universe.style}:${size}`, size, size, paintHazard(universe.style, universe.hazard, universe.accent));

      // Pixel invaders do not tumble, they bob, as they always have.
      if (universe.style === "pixels") {
        front.blit(sprite, x, y + Math.sin(now * 0.004 + hazard.shape) * drawn * 0.08, drawn, drawn);
      } else {
        front.blit(sprite, x, y, drawn, drawn, universe.style === "chips" ? spin * 2 : spin);
      }
    });
  }
}

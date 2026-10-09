import type { RenderLayer } from "@/packages/games/engine";

import { VoyageFrame, sizeBucket } from "../frame";
import { AIR_TINT, bodyExtent, paintBody, paintHalo } from "../paint/planets";
import { RenderKit } from "./kit";

// The planets: each painted once with its bands, storms, craters and shading, behind the halo of its air drawn to
// the real top of its atmosphere, and only when the camera can see it.
export class BodiesLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "bodies";

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, camera }: VoyageFrame): void {
    if (state.phase !== "solar" && state.phase !== "singularity") {
      return;
    }

    const { back } = this.kit;
    const base = camera.scale / camera.zoom;

    state.route.bodies.forEach((body) => {
      const outer = body.radius + (body.atmosphere?.top ?? 0);

      if (!camera.sees(body.x, body.y, outer * 2.4)) {
        return;
      }

      const x = camera.toScreenX(body.x);
      const y = camera.toScreenY(body.y);

      if (body.atmosphere && AIR_TINT[body.id]) {
        const size = sizeBucket(outer * 2 * base);
        const halo = this.kit.sprite(`halo:${body.id}:${size}`, size, size, paintHalo(AIR_TINT[body.id], body.radius / outer));

        back.blit(halo, x, y, outer * 2 * camera.scale, outer * 2 * camera.scale);
      }

      const extent = bodyExtent(body.id);
      const size = sizeBucket(body.radius * base);
      const sprite = this.kit.sprite(`body:${body.id}:${size}`, extent.width * size, extent.height * size, paintBody(body.id));

      back.blit(sprite, x, y, extent.width * body.radius * camera.scale, extent.height * body.radius * camera.scale);
    });
  }
}

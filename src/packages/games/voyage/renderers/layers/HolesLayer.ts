import type { RenderLayer } from "@/packages/games/engine";

import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { DISK_REACH, LENS_REACH, paintDisk, paintLens } from "../paint/space";
import { Surface } from "../Surface";
import { RenderKit } from "./kit";

const TAU = Math.PI * 2;
const SQUASH = 0.32;

// A black hole's disk of gas, in two passes. On the back surface the whole disk, so the GPU lens can bend its far
// side over the top as real ones look; where there is no GPU lens, the back pass also draws the lensed light, the
// shadow and the photon ring itself. On the front surface the near half again, unbent, crossing the shadow.
export class HolesLayer implements RenderLayer<VoyageFrame> {
  public readonly name: string;

  constructor(private readonly kit: RenderKit, private readonly pass: "back" | "front") {
    this.name = `holes:${pass}`;
  }

  public draw({ state, world, camera, alpha, now, isLensed }: VoyageFrame): void {
    if (state.phase === "lost") {
      return;
    }

    const surface = this.pass === "back" ? this.kit.back : this.kit.front;
    const base = camera.scale / camera.zoom;
    const spin = now * 0.0009;

    world.stores.hole.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);
      const hole = world.stores.hole.values[index];

      if (!body || !camera.sees(body.x, body.y, hole.horizon * LENS_REACH)) {
        return;
      }

      const x = camera.toScreenX(lerpX(body, alpha));
      const y = camera.toScreenY(lerpY(body, alpha));
      const horizon = hole.horizon * camera.scale;
      const diskSize = sizeBucket(hole.horizon * base * DISK_REACH * 2);
      const disk = this.kit.sprite(`disk:${diskSize}`, diskSize, diskSize, paintDisk(this.kit.theme.diskHot, this.kit.theme.disk));

      if (this.pass === "front") {
        surface.context.save();
        surface.context.beginPath();
        surface.context.rect(x - horizon * DISK_REACH, y, horizon * DISK_REACH * 2, horizon * DISK_REACH);
        surface.context.clip();
        this.drawDisk(surface, disk, x, y, horizon, spin);
        surface.context.restore();
        surface.reset();

        return;
      }

      if (!isLensed) {
        const lensSize = sizeBucket(hole.horizon * base * LENS_REACH * 2);
        const lens = this.kit.sprite(`lens:${lensSize}`, lensSize, lensSize, paintLens(this.kit.theme.star));

        surface.blit(lens, x, y, horizon * LENS_REACH * 2, horizon * LENS_REACH * 2, now * 0.00025);
      }

      this.drawDisk(surface, disk, x, y, horizon, spin);

      if (!isLensed) {
        surface.context.fillStyle = "#000000";
        surface.context.beginPath();
        surface.context.arc(x, y, horizon, 0, TAU);
        surface.context.fill();
        surface.context.strokeStyle = this.kit.theme.diskHot;
        surface.context.globalAlpha = 0.9;
        surface.context.lineWidth = Math.max(1.2, horizon * 0.05);
        surface.context.beginPath();
        surface.context.arc(x, y, horizon * 1.08, 0, TAU);
        surface.context.stroke();
        surface.context.globalAlpha = 1;
      }
    });
  }

  private drawDisk(surface: Surface, disk: ReturnType<RenderKit["sprite"]>, x: number, y: number, horizon: number, spin: number): void {
    if (!disk) {
      return;
    }

    const size = horizon * DISK_REACH * 2;

    surface.frame(x, y, 0, 1, SQUASH);
    surface.context.rotate(spin);
    surface.context.drawImage(disk.surface, -size / 2, -size / 2, size, size);
    surface.reset();
  }
}

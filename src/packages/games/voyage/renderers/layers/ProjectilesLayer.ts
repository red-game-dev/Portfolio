import type { RenderLayer } from "@/packages/games/engine";

import { lerpX, lerpY, VoyageFrame } from "../frame";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// How each kind of shot looks: its colour for the ship's side and for theirs, its length along its path (world
// units) and its glow (world units).
const LOOKS = {
  cannon: { ship: "rgba(255, 220, 140, 1)", aliens: "rgba(255, 110, 90, 1)", length: 0.16, glow: 0.07 },
  laser: { ship: "rgba(140, 220, 255, 1)", aliens: "rgba(255, 80, 200, 1)", length: 0.45, glow: 0.05 },
  missile: { ship: "rgba(255, 240, 200, 1)", aliens: "rgba(255, 150, 70, 1)", length: 0.1, glow: 0.09 },
  spit: { ship: "rgba(170, 255, 120, 1)", aliens: "rgba(150, 255, 90, 1)", length: 0.06, glow: 0.1 },
  photoid: { ship: "rgba(255, 255, 255, 1)", aliens: "rgba(255, 255, 255, 1)", length: 2.4, glow: 0.18 },
  mine: { ship: "rgba(255, 90, 80, 1)", aliens: "rgba(255, 90, 80, 1)", length: 0, glow: 0.08 },
  flak: { ship: "rgba(255, 210, 120, 1)", aliens: "rgba(255, 210, 120, 1)", length: 0.07, glow: 0.035 },
  backup: { ship: "rgba(200, 200, 210, 1)", aliens: "rgba(200, 200, 210, 1)", length: 0.08, glow: 0.035 },
  rail: { ship: "rgba(160, 240, 255, 1)", aliens: "rgba(160, 240, 255, 1)", length: 0.5, glow: 0.06 },
  emp: { ship: "rgba(120, 200, 255, 1)", aliens: "rgba(120, 200, 255, 1)", length: 0, glow: 0.1 },
};

// Shots in flight: bolts and beams streaked along their path, missiles trailing smoke, organic spit as glowing
// blobs, and the dark forest's strike, a white needle too fast to see coming.
export class ProjectilesLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "projectiles";

  constructor(private readonly kit: RenderKit) {}

  public draw({ world, camera, alpha }: VoyageFrame): void {
    if (world.stores.projectile.size === 0) {
      return;
    }

    const { front, particles } = this.kit;
    const context = front.context;

    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    world.stores.projectile.entities.forEach((entity, index) => {
      const shot = world.stores.projectile.values[index];
      const body = world.stores.body.get(entity);
      const look = LOOKS[shot.kind];

      if (!body || !camera.sees(body.x, body.y, look.length + 0.2)) {
        return;
      }

      const colour = shot.team === "ship" ? look.ship : look.aliens;
      const speed = Math.hypot(body.vx, body.vy) || 1;
      const x = lerpX(body, alpha);
      const y = lerpY(body, alpha);
      const tailX = x - (body.vx / speed) * look.length;
      const tailY = y - (body.vy / speed) * look.length;
      const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

      context.strokeStyle = colour;
      context.lineWidth = Math.max(1.2, look.glow * camera.scale * 0.35);
      context.beginPath();
      context.moveTo(camera.toScreenX(tailX), camera.toScreenY(tailY));
      context.lineTo(camera.toScreenX(x), camera.toScreenY(y));
      context.stroke();
      front.blit(glow, camera.toScreenX(x), camera.toScreenY(y), look.glow * 2 * camera.scale, look.glow * 2 * camera.scale);

      if (shot.kind === "missile" && Math.random() < 0.5) {
        const smoke = this.kit.cache.get("smoke", 64, 64, paintGlow("rgba(70, 70, 78, 0.9)"));

        particles.emit("smoke", tailX, tailY, 0, 0, 0.6, 0.03, smoke, { grow: 0.05, drag: 1 });
      }
    });
    context.globalCompositeOperation = "source-over";
  }
}

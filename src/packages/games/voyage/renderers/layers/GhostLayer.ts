import type { RenderLayer } from "@/packages/games/engine";

import { ghostAt, placeCode } from "../../core/GhostRecorder";
import { GhostRun } from "../../domain/ghost";
import { sizeBucket, VoyageFrame } from "../frame";
import { paintHull } from "../paint/ships";
import { paintGlow, SHIP_HEIGHT, SHIP_WIDTH } from "../paint/space";
import { RenderKit } from "./kit";

// A ghost's own colours: a pale cyan ship, all light and no metal.
const GHOST = { hull: "#9bf0ff", hullShade: "#2f7f99", window: "#e8fdff", fin: "#246379", accent: "#9bf0ff" };
const paintGhost = paintHull("rocket", 1, GHOST);
const GLOW = "rgba(155, 240, 255, 1)";

// The best run of today's daily voyage, flying beside the ship where it was at this moment of its run: a
// translucent ship in a soft glow, with its name over it, and nothing when it was somewhere else then.
export class GhostLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "ghost";
  public run: GhostRun | null = null;

  constructor(private readonly kit: RenderKit) {}

  public draw({ state, world, camera, now }: VoyageFrame): void {
    if (!this.run || state.status !== "flying") {
      return;
    }

    const at = ghostAt(this.run, state.elapsedMs, placeCode(state.phase, state.universe));
    const ship = world.stores.body.get(state.ship);

    if (!at || !ship || !camera.sees(at.x, at.y, ship.radius * 4)) {
      return;
    }

    const { front } = this.kit;
    const r = ship.radius * camera.scale;
    const size = sizeBucket(ship.radius * (camera.scale / camera.zoom));
    const sprite = this.kit.sprite(`ghost:${size}`, size * SHIP_WIDTH, size * SHIP_HEIGHT, paintGhost);
    const glow = this.kit.cache.get(`glow:${GLOW}`, 64, 64, paintGlow(GLOW));
    const x = camera.toScreenX(at.x);
    const y = camera.toScreenY(at.y);
    const context = front.context;

    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 0.18 + Math.sin(now * 0.004) * 0.05;
    front.blit(glow, x, y, r * 5, r * 5);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.5;
    front.frame(x, y, at.angle + Math.PI / 2, 1, 1);

    if (sprite) {
      context.drawImage(sprite.surface, -r * SHIP_WIDTH / 2, -r * SHIP_HEIGHT / 2, r * SHIP_WIDTH, r * SHIP_HEIGHT);
    }

    front.reset();
    context.globalAlpha = 0.75;

    const label = this.kit.labels.ghost;

    if (label) {
      context.font = "600 11px Roboto, sans-serif";
      context.textAlign = "center";
      context.fillStyle = GHOST.hull;
      context.fillText(label, x, y - r * 2.2);
    }

    context.globalAlpha = 1;
  }
}

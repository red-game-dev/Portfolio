import type { RenderLayer } from "@/packages/games/engine";

import { DEEP_STYLES } from "../../domain/theme";
import { auForRadius } from "../../utils/scale";
import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { paintHazard, paintPickup, paintRock } from "../paint/hazards";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// How far a comet's tails can reach (world units), so it is drawn while they are in view.
const TAIL_REACH = 7;

// The colour of each kind of pickup: coins are gold everywhere, so they read as coin in every universe.
const PICKUP_COLOUR = { coin: "#ffd76a", shield: "#4fd8ff", fuel: "#62ffc8", repair: "#ff8fa3" };
// How fast a coin turns over as it drifts (radians a millisecond), and the narrowest it gets edge on.
const COIN_SPIN = 0.004;
const COIN_EDGE = 0.22;

// What drifts through space: pickups pulsing softly (coins turning over as they go), rocks tumbling (icy out past Neptune), and in the universes
// each one's own hazards. Only what the camera can see is drawn, each from a sprite painted once per size.
export class ThingsLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "things";

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state, world, camera, alpha, now, universe } = frame;

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
      const colour = PICKUP_COLOUR[kind];
      const size = sizeBucket(body.radius * 3 * base);
      const sprite = this.kit.sprite(`pickup:${kind}:${colour}:${size}`, size, size, paintPickup(kind, colour));
      const drawn = body.radius * 3 * camera.scale * pulse;
      const turn = kind === "coin" ? Math.max(COIN_EDGE, Math.abs(Math.cos(now * COIN_SPIN + entity))) : 1;

      front.blit(sprite, camera.toScreenX(lerpX(body, alpha)), camera.toScreenY(lerpY(body, alpha)), drawn * turn, drawn);
    });

    world.stores.hazard.entities.forEach((entity, index) => {
      const body = world.stores.body.get(entity);

      const hazard = world.stores.hazard.values[index];

      if (!body || !camera.sees(body.x, body.y, hazard.isComet ? TAIL_REACH : body.radius * 1.3)) {
        return;
      }

      const spin = world.stores.spin.get(entity)?.angle ?? 0;
      const size = sizeBucket(body.radius * 2.4 * base);
      const drawn = body.radius * 2.4 * camera.scale;
      const x = camera.toScreenX(lerpX(body, alpha));
      const y = camera.toScreenY(lerpY(body, alpha));

      // Past the zones, what drifts is rock, as it is at home.
      if (!universe || DEEP_STYLES.includes(universe.style)) {
        if (hazard.isComet && !universe) {
          this.drawTails(frame, body, x, y);
        }

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

  // A comet's two tails, both streaming away from the star and growing as it nears: the straight blue tail of
  // gas the solar wind blows out, and the broader dust tail curving back along its path. Round the nucleus, its
  // glowing coma.
  private drawTails({ state, camera }: VoyageFrame, body: { x: number; y: number; vx: number; vy: number; radius: number }, x: number, y: number): void {
    const { front } = this.kit;
    const { star, scale } = state.system;
    const out = Math.hypot(body.x - star.x, body.y - star.y) || 1;
    const activity = Math.min(1.2, 2.5 / auForRadius(scale, out));

    if (activity < 0.05) {
      return;
    }

    const ux = (body.x - star.x) / out;
    const uy = (body.y - star.y) / out;
    const length = (1 + 5 * activity) * camera.scale;
    const speed = Math.hypot(body.vx, body.vy) || 1;
    // The dust lags behind the comet's motion.
    const lagX = -body.vx / speed;
    const lagY = -body.vy / speed;
    const width = body.radius * camera.scale;
    const context = front.context;

    context.globalCompositeOperation = "lighter";

    const dust = context.createLinearGradient(x, y, x + ux * length, y + uy * length);

    dust.addColorStop(0, `rgba(255, 240, 210, ${0.5 * activity})`);
    dust.addColorStop(1, "rgba(255, 230, 190, 0)");
    context.fillStyle = dust;
    context.beginPath();
    context.moveTo(x - uy * width, y + ux * width);
    context.quadraticCurveTo(x + ux * length * 0.5 + lagX * length * 0.25, y + uy * length * 0.5 + lagY * length * 0.25,
      x + ux * length * 0.85 + lagX * length * 0.45 - uy * width * 6, y + uy * length * 0.85 + lagY * length * 0.45 + ux * width * 6);
    context.lineTo(x + ux * length * 0.85 + lagX * length * 0.45 + uy * width * 6, y + uy * length * 0.85 + lagY * length * 0.45 - ux * width * 6);
    context.quadraticCurveTo(x + ux * length * 0.5, y + uy * length * 0.5, x + uy * width, y - ux * width);
    context.closePath();
    context.fill();

    const ion = context.createLinearGradient(x, y, x + ux * length * 1.3, y + uy * length * 1.3);

    ion.addColorStop(0, `rgba(140, 200, 255, ${0.6 * activity})`);
    ion.addColorStop(1, "rgba(120, 180, 255, 0)");
    context.strokeStyle = ion;
    context.lineWidth = Math.max(1, width * 0.7);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + ux * length * 1.3, y + uy * length * 1.3);
    context.stroke();

    const coma = this.kit.cache.get("glow:coma", 64, 64, paintGlow("rgba(200, 230, 255, 1)"));

    context.globalAlpha = Math.min(1, 0.4 + activity * 0.5);
    front.blit(coma, x, y, width * 9, width * 9);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }
}

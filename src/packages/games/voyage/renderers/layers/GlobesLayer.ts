import type { RenderLayer } from "@/packages/games/engine";
import { northUp } from "@/packages/graphics/globe";

import { SystemBody } from "../../domain/content";
import { VoyageFrame } from "../frame";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// Below this radius on screen a body is a point of light rather than a globe, as a planet is to the eye.
const POINT_RADIUS = 1.6;
// How far above their equators the bodies are seen from (degrees).
const VIEW_ELEVATION = 20;
// How long a flare burns on the star's limb (ms).
const FLARE_MS = 4000;

// The Sun and every body, drawn by the GPU each frame: lit from where the Sun really is, turned to where they
// really are on the mission clock, a moon that keeps one face to its planet keeping it, Earth's aurora as bright
// as the storms have left it, dimmer the further out, and each north kept as near the top of the screen as its
// light allows. A body too small to see is a point of light.
export class GlobesLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "globes";
  private readonly turned = new Map<string, boolean>();

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state } = frame;

    if (state.phase !== "solar" && state.phase !== "singularity") {
      return;
    }

    this.drawStar(frame);
    state.system.bodies.forEach((body) => this.drawBody(frame, body));
  }

  private drawStar({ state, camera, now, theme }: VoyageFrame): void {
    const { star } = state.system;
    const { back, globes } = this.kit;

    if (!camera.sees(star.x, star.y, star.radius * 3)) {
      return;
    }

    const x = camera.toScreenX(star.x);
    const y = camera.toScreenY(star.y);
    const radius = star.radius * camera.scale;
    const flare = state.flare && state.elapsedMs - state.flare.at < FLARE_MS ? state.flare : null;
    const glow = this.kit.cache.get("glow:star", 128, 128, paintGlow("rgba(255, 214, 160, 1)"));

    // Light scattered round the star, added to the sky rather than laid over it.
    back.context.globalCompositeOperation = "lighter";
    back.context.globalAlpha = 0.45;
    back.blit(glow, x, y, radius * 7, radius * 7);
    back.context.globalAlpha = 1;
    back.context.globalCompositeOperation = "source-over";
    globes.drawStar(back.context, {
      x,
      y,
      radius,
      look: theme.sun,
      time: now / 1000,
      flare: flare ? { angle: flare.angle, strength: flare.strength * (1 - (state.elapsedMs - flare.at) / FLARE_MS) } : null,
    });
  }

  private drawBody({ state, camera, now, theme }: VoyageFrame, body: SystemBody): void {
    const look = theme.bodies[body.id];
    const reach = body.radius * Math.max(1.2, look?.rings?.outer ?? 0, 1 + (look?.atmosphere?.thickness ?? 0));

    if (!look || !camera.sees(body.x, body.y, reach)) {
      return;
    }

    const { back, globes } = this.kit;
    const { star } = state.system;
    const x = camera.toScreenX(body.x);
    const y = camera.toScreenY(body.y);
    const radius = body.radius * camera.scale;

    if (radius < POINT_RADIUS) {
      back.context.fillStyle = look.surface.palette[2];
      back.context.beginPath();
      back.context.arc(x, y, POINT_RADIUS, 0, Math.PI * 2);
      back.context.fill();

      return;
    }

    const lightAngle = Math.atan2(star.y - body.y, star.x - body.x);
    const isTurned = northUp(lightAngle, this.turned.get(body.id) ?? false);
    const parent = body.dayHours === null && body.parent ? state.system.bodies.find((candidate) => candidate.id === body.parent) : undefined;

    this.turned.set(body.id, isTurned);
    globes.drawGlobe(back.context, {
      x,
      y,
      radius,
      look,
      pose: {
        lightAngle,
        subsolarLatitude: body.subsolarLatitude,
        subsolarLongitude: body.subsolarLongitude,
        viewElevation: VIEW_ELEVATION,
        isTurned,
        facing: parent ? Math.atan2(parent.y - body.y, parent.x - body.x) : undefined,
      },
      time: now / 1000,
      light: Math.max(0.5, Math.min(1.1, 1.1 - 0.12 * Math.log(Math.max(body.au, 0.1)))),
      aurora: body.id === "earth" ? state.aurora : 0,
      craters: [],
    });
  }
}

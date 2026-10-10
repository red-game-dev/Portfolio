import type { RenderLayer } from "@/packages/games/engine";
import { GlobePose, northUp, StarLook } from "@/packages/graphics/globe";
import { TAU } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { HOME_WORLD, SystemBody, SystemStar } from "../../domain/content";
import { VoyageState } from "../../domain/state";
import { lightAt } from "../../utils/stars";
import { VoyageFrame } from "../frame";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// Below this radius on screen a body is a point of light rather than a globe, as a planet is to the eye.
const POINT_RADIUS = 1.6;
// How far above their equators the bodies are seen from (degrees).
const VIEW_ELEVATION = 20;
// How long a flare burns on the star's limb (ms).
const FLARE_MS = 4000;

// How lit a world is from the light falling on it (in Suns at 1 AU, every star's added up): dimmer the further out
// and the fainter its stars, a rogue with no star at all lit only by starlight from the sky.
const lightOn = (flux: number): number => (flux <= 0 ? 0.07 : clamp(1.1 + 0.06 * Math.log(Math.min(flux, 400)), 0.3, 1.15));

// Every star and every body, drawn by the GPU each frame: lit from where their brightest star really is, turned to where they
// really are on the mission clock, a moon that keeps one face to its planet keeping it, Earth's aurora as bright
// as the storms have left it, dimmer the further out, and each north kept as near the top of the screen as its
// light allows. A body too small to see is a point of light.
export class GlobesLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "globes";
  // Covered by the view from a world's surface: nothing here would be seen.
  public isHidden = false;
  private readonly turned = new Map<string, boolean>();

  constructor(private readonly kit: RenderKit) {}

  // How a body is posed as it is drawn now: lit from the star that shines brightest on it, turned so its north stays
  // up, a moon that keeps one face to its planet keeping it. The view from its surface reads the spot under the ship
  // from this.
  public poseOf(state: Readonly<VoyageState>, body: SystemBody): GlobePose {
    const star = lightAt(state.system, body.x, body.y).brightest;
    const lightAngle = Math.atan2(star.y - body.y, star.x - body.x);
    const parent = body.dayHours === null && body.parent ? state.system.bodies.find((candidate) => candidate.id === body.parent) : undefined;

    return {
      lightAngle,
      subsolarLatitude: body.subsolarLatitude,
      subsolarLongitude: body.subsolarLongitude,
      viewElevation: VIEW_ELEVATION,
      isTurned: northUp(lightAngle, this.turned.get(body.id) ?? false),
      facing: parent ? Math.atan2(parent.y - body.y, parent.x - body.x) : undefined,
    };
  }

  public draw(frame: VoyageFrame): void {
    const { state } = frame;

    if (state.phase === "lost" || this.isHidden) {
      return;
    }

    this.drawStar(frame, state.system.star, state.cosmos ? state.cosmos.starLook : frame.theme.sun, true);
    state.system.companions.forEach((other, order) => this.drawStar(frame, other, state.cosmos?.companionLooks[order] ?? null, false));
    state.system.bodies.forEach((body) => this.drawBody(frame, body));
  }

  // A star, its own light scattered round it; the brightest one flares.
  private drawStar({ state, camera, now }: VoyageFrame, star: SystemStar, look: StarLook | null, isBrightest: boolean): void {
    const { back, globes } = this.kit;

    if (!look || star.luminosity <= 0 || !camera.sees(star.x, star.y, star.radius * 3)) {
      return;
    }

    const x = camera.toScreenX(star.x);
    const y = camera.toScreenY(star.y);
    const radius = star.radius * camera.scale;
    const flare = isBrightest && state.flare && state.elapsedMs - state.flare.at < FLARE_MS ? state.flare : null;
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
      look,
      time: now / 1000,
      flare: flare ? { angle: flare.angle, strength: flare.strength * (1 - (state.elapsedMs - flare.at) / FLARE_MS) } : null,
    });
  }

  private drawBody({ state, camera, now, theme }: VoyageFrame, body: SystemBody): void {
    const look = theme.bodies[body.id] ?? state.cosmos?.looks[body.id];
    const reach = body.radius * Math.max(1.2, look?.rings?.outer ?? 0, 1 + (look?.atmosphere?.thickness ?? 0));

    if (!look || body.isShattered || !camera.sees(body.x, body.y, reach)) {
      return;
    }

    const { back, globes } = this.kit;
    const x = camera.toScreenX(body.x);
    const y = camera.toScreenY(body.y);
    const radius = body.radius * camera.scale;

    if (radius < POINT_RADIUS) {
      back.context.fillStyle = look.surface.palette[2];
      back.context.beginPath();
      back.context.arc(x, y, POINT_RADIUS, 0, TAU);
      back.context.fill();

      return;
    }

    const pose = this.poseOf(state, body);

    this.turned.set(body.id, pose.isTurned);
    globes.drawGlobe(back.context, {
      x,
      y,
      radius,
      look,
      pose,
      time: now / 1000,
      light: lightOn(lightAt(state.system, body.x, body.y).flux),
      aurora: body.id === HOME_WORLD ? state.aurora : 0,
      craters: state.craters[body.id] ?? [],
    });
  }
}

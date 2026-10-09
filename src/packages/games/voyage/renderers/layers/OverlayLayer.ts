import type { RenderLayer } from "@/packages/games/engine";
import { createSeededRandom } from "@/packages/math/random";

import { VoyageFrame } from "../frame";
import { paintDarkness, paintVignette } from "../paint/overlay";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

const TAU = Math.PI * 2;
// The compass ring round a stop in sight, in CSS pixels; a stop drawn bigger than this needs no ring.
const RING_RADIUS = 18;
// Sunlight (W/m^2) where the glare begins (inside Mercury's orbit), how many orders of magnitude more it takes
// to reach its full strength (the Sun's surface), and that strength.
const GLARE_FROM = 20000;
const GLARE_DECADES = 3.5;
const GLARE_MAX = 0.55;

// Over everything: inside a giant the clouds close in as the air thickens, a planet's air hazes the view, heat and
// a failing hull redden the edges, the fall into a black hole darkens to nothing, the tunnel between universes
// streams past, the compass points the way from the edge of the screen, and flashes fade.
export class OverlayLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "overlay";
  private readonly streaks: Array<{ angle: number; speed: number; offset: number }>;
  private flash = 0;
  private flashColour = "#ffffff";

  constructor(private readonly kit: RenderKit) {
    const random = createSeededRandom(5);

    this.streaks = Array.from({ length: 110 }, () => ({ angle: random() * TAU, speed: 0.35 + random() * 0.9, offset: random() }));
  }

  public flashScreen(colour: string, strength = 1): void {
    this.flashColour = colour;
    this.flash = Math.max(this.flash, strength);
  }

  public draw(frame: VoyageFrame): void {
    const { state, world, dt } = frame;
    const { front } = this.kit;

    if (state.phase === "lost") {
      this.drawTunnel(frame);
    } else {
      this.drawAir(frame);

      const ship = world.stores.ship.get(state.ship);
      const health = world.stores.health.get(state.ship);

      // Heat reddens the edges from half the plating's rating, fully at it.
      const melt = frame.config.thermal.ratings.hull;

      if (ship && ship.temperatureC > melt * 0.5) {
        this.vignette("rgba(255, 110, 30, 0.85)", Math.min(1, (ship.temperatureC - melt * 0.5) / (melt * 0.5)));
      }

      if (health && state.status === "flying" && health.hull / health.maxHull < 0.3) {
        this.vignette("rgba(255, 30, 40, 0.9)", (0.35 + Math.sin(frame.now * 0.008) * 0.25) * (1 - health.hull / health.maxHull / 0.3 * 0.5));
      }

      this.drawGlare(frame);

      if (state.capture) {
        this.drawFall(frame);
      }

      this.drawCompass(frame);
    }

    this.flash = Math.max(0, this.flash - dt * 2.5);

    if (this.flash > 0) {
      front.context.globalAlpha = this.flash * 0.6;
      front.context.fillStyle = this.flashColour;
      front.context.fillRect(0, 0, front.width, front.height);
      front.context.globalAlpha = 1;
    }
  }

  private vignette(colour: string, strength: number): void {
    const { front } = this.kit;
    const sprite = this.kit.cache.get(`vignette:${colour}`, 256, 256, paintVignette(colour));

    if (sprite && strength > 0) {
      const size = Math.max(front.width, front.height) * 1.2;

      front.context.globalAlpha = Math.min(1, strength);
      front.context.drawImage(sprite.surface, (front.width - size) / 2, (front.height - size) / 2, size, size);
      front.context.globalAlpha = 1;
    }
  }

  // Inside air the view hazes in the air's own colour, closing in with its density: a giant's clouds and the
  // depths of Venus or Titan swallow the view, Earth's sky is a blue haze, Mars's barely there.
  private drawAir({ state, theme }: VoyageFrame): void {
    const { readings } = state;
    const body = state.system.bodies.find((candidate) => candidate.id === readings.airOf);
    const tint = readings.airOf ? theme.bodies[readings.airOf]?.atmosphere?.colour : undefined;

    if (!tint || !body || readings.density <= 0) {
      return;
    }

    const { front } = this.kit;
    const thickness = body.isGiant ? Math.min(0.9, 0.12 + readings.density * 0.45) : Math.min(0.85, readings.density * 0.3);

    front.context.globalAlpha = thickness;
    front.context.fillStyle = tint;
    front.context.fillRect(0, 0, front.width, front.height);
    front.context.globalAlpha = 1;
  }

  // Close to the star its light is blinding: the whole view washes out, more the closer the ship flies, growing
  // with the order of magnitude of the sunlight rather than the sunlight itself, as an eye or a camera does.
  private drawGlare({ state }: VoyageFrame): void {
    const glare = GLARE_MAX * Math.min(1, Math.max(0, Math.log10(state.readings.sunlight / GLARE_FROM) / GLARE_DECADES));

    if (glare <= 0) {
      return;
    }

    const { front } = this.kit;

    front.context.globalCompositeOperation = "lighter";
    front.context.globalAlpha = glare;
    front.context.fillStyle = "#fff1d6";
    front.context.fillRect(0, 0, front.width, front.height);
    front.context.globalAlpha = 1;
    front.context.globalCompositeOperation = "source-over";
  }

  private drawFall({ state, camera }: VoyageFrame): void {
    const capture = state.capture;

    if (!capture) {
      return;
    }

    const { front } = this.kit;
    const dark = this.kit.cache.get("darkness", 256, 256, paintDarkness);
    const size = Math.max(front.width, front.height) * (0.6 + capture.progress * 2.2);

    front.context.globalAlpha = Math.min(1, capture.progress * 1.2);
    front.blit(dark, camera.toScreenX(capture.centre.x), camera.toScreenY(capture.centre.y), size, size);

    if (capture.progress > 0.85) {
      front.context.globalAlpha = (capture.progress - 0.85) / 0.15;
      front.context.fillStyle = "#000000";
      front.context.fillRect(0, 0, front.width, front.height);
    }

    front.context.globalAlpha = 1;
  }

  // Light streaming past from a point ahead, slow and long the first time through.
  private drawTunnel({ state }: VoyageFrame): void {
    const { front, theme } = this.kit;
    const cx = front.width / 2;
    const cy = front.height / 2;
    const reach = Math.hypot(front.width, front.height) / 2;
    const seconds = (state.phaseMs / 1000) * (state.universes === 0 ? 0.45 : 1.2);
    const glow = this.kit.cache.get(`glow:${theme.window}`, 64, 64, paintGlow(theme.window));

    front.context.strokeStyle = theme.window;
    front.context.lineCap = "round";
    this.streaks.forEach((streak) => {
      const progress = (streak.offset + seconds * streak.speed) % 1;
      const from = progress * progress * reach;
      const length = reach * (0.02 + progress * 0.18);

      front.context.globalAlpha = progress * 0.9;
      front.context.lineWidth = 0.5 + progress * 2.2;
      front.context.beginPath();
      front.context.moveTo(cx + Math.cos(streak.angle) * from, cy + Math.sin(streak.angle) * from);
      front.context.lineTo(cx + Math.cos(streak.angle) * (from + length), cy + Math.sin(streak.angle) * (from + length));
      front.context.stroke();
    });
    front.context.globalAlpha = 0.5 + Math.sin(state.phaseMs * 0.004) * 0.2;
    front.blit(glow, cx, cy, Math.min(front.width, front.height) * 0.35, Math.min(front.width, front.height) * 0.35);
    front.context.globalAlpha = Math.max(0, 1 - state.phaseMs / 600);
    front.context.fillStyle = "#000000";
    front.context.fillRect(0, 0, front.width, front.height);
    front.context.globalAlpha = 1;
  }

  // An arrow at the edge of the screen towards the next stop when it is out of sight, a ring round it when it is
  // in sight but small, and nothing once it is big enough to see for itself.
  private drawCompass({ state, camera, now }: VoyageFrame): void {
    const { waypoint } = state;

    if (!waypoint || state.capture) {
      return;
    }

    const { front, theme } = this.kit;
    const x = camera.toScreenX(waypoint.x);
    const y = camera.toScreenY(waypoint.y);
    const margin = 46;
    const isVisible = x > margin && x < front.width - margin && y > margin && y < front.height - margin;

    front.context.strokeStyle = theme.window;
    front.context.fillStyle = theme.window;

    if (isVisible) {
      if (waypoint.radius * camera.scale > RING_RADIUS) {
        return;
      }

      front.context.globalAlpha = 0.35 + Math.sin(now * 0.004) * 0.15;
      front.context.lineWidth = 1.5;
      front.context.beginPath();
      front.context.arc(x, y, RING_RADIUS + Math.sin(now * 0.004) * 3, 0, TAU);
      front.context.stroke();
      front.context.globalAlpha = 1;

      return;
    }

    const cx = front.width / 2;
    const cy = front.height / 2;
    const angle = Math.atan2(y - cy, x - cx);
    const edge = Math.min((front.width / 2 - margin) / Math.abs(Math.cos(angle) || 1e-6), (front.height / 2 - margin) / Math.abs(Math.sin(angle) || 1e-6));
    const ax = cx + Math.cos(angle) * edge;
    const ay = cy + Math.sin(angle) * edge;

    front.frame(ax, ay, angle);
    front.context.globalAlpha = 0.85;
    front.context.beginPath();
    front.context.moveTo(14, 0);
    front.context.lineTo(-8, -9);
    front.context.lineTo(-3, 0);
    front.context.lineTo(-8, 9);
    front.context.closePath();
    front.context.fill();
    front.reset();
  }
}

import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { clamp01 } from "@/packages/math/clamp";
import { createSeededRandom } from "@/packages/math/random";

import { VoyageFrame } from "../frame";
import { paintDarkness, paintVignette } from "../paint/overlay";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// The colour of the way on: a black hole's violet.
const WAY_ON = "#b48cff";
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
  // The compass and the arrows to attackers; off in photo mode, where a picture wants no guides.
  public showsGuides = true;
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

      if (this.showsGuides) {
        this.drawCompass(frame);
        this.drawWayOn(frame);
        this.drawAttackers(frame);
      }
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
    const glare = GLARE_MAX * clamp01(Math.log10(state.readings.sunlight / GLARE_FROM) / GLARE_DECADES);

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

  // Red chevrons at the edge of the screen towards anyone coming for the ship from out of sight.
  private drawAttackers({ world, camera, now }: VoyageFrame): void {
    const { front } = this.kit;
    const margin = 30;
    const cx = front.width / 2;
    const cy = front.height / 2;

    world.stores.alien.entities.forEach((entity, index) => {
      const alien = world.stores.alien.values[index];
      const at = world.stores.body.get(entity);

      if (!at || alien.threat <= 0 || alien.mode === "evade") {
        return;
      }

      const x = camera.toScreenX(at.x);
      const y = camera.toScreenY(at.y);

      if (x > margin && x < front.width - margin && y > margin && y < front.height - margin) {
        return;
      }

      const angle = Math.atan2(y - cy, x - cx);
      const edge = Math.min((front.width / 2 - margin) / Math.abs(Math.cos(angle) || 1e-6), (front.height / 2 - margin) / Math.abs(Math.sin(angle) || 1e-6));

      front.frame(cx + Math.cos(angle) * edge, cy + Math.sin(angle) * edge, angle);
      front.context.globalAlpha = 0.65 + Math.sin(now * 0.012 + index) * 0.25;
      front.context.strokeStyle = "#ff4d5e";
      front.context.lineWidth = 2.5;
      front.context.beginPath();
      front.context.moveTo(-6, -8);
      front.context.lineTo(4, 0);
      front.context.lineTo(-6, 8);
      front.context.stroke();
      front.reset();
    });
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

  // In a universe, the black hole that leads on: a violet arrow at the edge of the screen while it is out of sight, a
  // slow ring round it once it is in sight, each named, so the way to the next universe is never lost.
  private drawWayOn({ state, world, camera, now }: VoyageFrame): void {
    if (state.phase !== "universe" || state.capture || world.stores.hole.size === 0) {
      return;
    }

    const ship = world.stores.body.get(state.ship);
    let nearest: { x: number; y: number; radius: number } | null = null;
    let best = Infinity;

    for (const entity of world.stores.hole.entities) {
      const at = world.stores.body.get(entity);
      const distance = at && ship ? Math.hypot(at.x - ship.x, at.y - ship.y) : Infinity;

      if (at && distance < best) {
        best = distance;
        nearest = at;
      }
    }

    if (!nearest) {
      return;
    }

    const { front } = this.kit;
    const context = front.context;
    const label = this.kit.labels.wayOn ?? "";
    const x = camera.toScreenX(nearest.x);
    const y = camera.toScreenY(nearest.y);
    const margin = 46;
    const isVisible = x > margin && x < front.width - margin && y > margin && y < front.height - margin;

    context.strokeStyle = WAY_ON;
    context.fillStyle = WAY_ON;
    context.font = "600 11px Roboto, Arial, sans-serif";
    context.textAlign = "center";

    if (isVisible) {
      const ring = Math.max(RING_RADIUS, nearest.radius * camera.scale * 2.2) + Math.sin(now * 0.003) * 4;

      context.globalAlpha = 0.5;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(x, y, ring, 0, TAU);
      context.stroke();
      context.globalAlpha = 0.9;
      context.fillText(label, x, y - ring - 6);
      context.globalAlpha = 1;

      return;
    }

    const cx = front.width / 2;
    const cy = front.height / 2;
    const angle = Math.atan2(y - cy, x - cx);
    const edge = Math.min((front.width / 2 - margin) / Math.abs(Math.cos(angle) || 1e-6), (front.height / 2 - margin) / Math.abs(Math.sin(angle) || 1e-6));
    const ax = cx + Math.cos(angle) * edge;
    const ay = cy + Math.sin(angle) * edge;

    front.frame(ax, ay, angle);
    context.globalAlpha = 0.6 + Math.sin(now * 0.006) * 0.3;
    context.beginPath();
    context.arc(-2, 0, 7, 0, TAU);
    context.fill();
    context.fillStyle = "#05060c";
    context.beginPath();
    context.arc(-2, 0, 3.5, 0, TAU);
    context.fill();
    context.fillStyle = WAY_ON;
    context.beginPath();
    context.moveTo(16, 0);
    context.lineTo(7, -6);
    context.lineTo(7, 6);
    context.closePath();
    context.fill();
    front.reset();
    context.globalAlpha = 0.9;
    context.fillText(label, ax - Math.cos(angle) * 22, ay - Math.sin(angle) * 22 + 4);
    context.globalAlpha = 1;
  }
}

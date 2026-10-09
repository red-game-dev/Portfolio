import { Canvas2DContext, CanvasRenderer } from "@/packages/graphics/canvas";
import { easeInOut, lerp } from "@/packages/math/easing";

import { LaunchTheme } from "../config";
import { LaunchSize, LaunchState } from "../domain/types";

// How many screens tall the climb is: bands and the ground scroll this far past the ship.
const CLIMB_SCREENS = 3;

// Draws the launch: deep space over a warm horizon that falls away, stars streaming past at their depth,
// one coloured band per zone crossed, the ship with its flame, and the planet's curve once in orbit.
export class CanvasLaunchRenderer extends CanvasRenderer<LaunchState> {
  private readonly theme: LaunchTheme;

  constructor(context: Canvas2DContext, theme: LaunchTheme) {
    super(context, { background: theme.space });
    this.theme = theme;
  }

  public resize({ width, height }: LaunchSize, pixelRatio: number): void {
    this.resizeSurface(width, height, pixelRatio);
  }

  public draw(state: LaunchState, now: number): void {
    const { width, height } = this.size;

    if (width === 0 || height === 0) {
      return;
    }

    this.clear();
    this.drawHorizon(state.altitude);
    this.drawStars(state);
    this.drawPlanet(state.altitude);
    this.drawGround(state.altitude);

    const shipY = lerp(height * 0.74, height * 0.46, easeInOut(state.altitude * 3));
    // The ship shakes harder as the countdown runs down.
    const shake = state.status === "destructing" ? Math.sin(now * 0.09) * (1.5 + state.destructMs / 600) : 0;

    this.drawMarkers(state, shipY);

    if (state.status === "exploding") {
      this.drawExplosion(state, width / 2, shipY);
    } else {
      this.drawShip(width / 2 + shake, shipY, state, now);
    }

    if (state.status === "destructing") {
      this.drawAlarm(state, now);
    }

    this.context.globalAlpha = 1;
  }

  // The whole board pulsing red, and the seconds left, big.
  private drawAlarm(state: LaunchState, now: number): void {
    const { width, height } = this.size;
    const context = this.context;

    context.globalAlpha = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(now * 0.014));
    context.fillStyle = this.theme.alarm;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.9;
    context.fillStyle = this.theme.alarm;
    context.font = `700 ${Math.round(height * 0.32)}px Roboto, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(state.countdown), width * 0.78, height * 0.5);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
  }

  // A white flash, a fireball that swells and fades, the ship in pieces flying apart, and a ring of shock.
  private drawExplosion(state: LaunchState, x: number, y: number): void {
    const { width, height } = this.size;
    const context = this.context;
    const progress = state.explosion;
    const reach = Math.min(width, height);

    context.globalAlpha = Math.max(0, 1 - progress * 4);
    context.fillStyle = this.theme.flameCore;
    context.fillRect(0, 0, width, height);

    const radius = reach * (0.08 + easeInOut(progress) * 0.35);
    const fire = context.createRadialGradient(x, y, 0, x, y, radius);

    fire.addColorStop(0, this.theme.flameCore);
    fire.addColorStop(0.35, this.theme.flameEdge);
    fire.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = Math.max(0, 1 - progress);
    context.fillStyle = fire;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = this.theme.hull;
    state.debris.forEach((piece) => {
      const distance = piece.speed * reach * 0.6 * easeInOut(progress * 1.2);

      context.globalAlpha = Math.max(0, 1 - progress * 1.1);
      context.fillRect(x + Math.cos(piece.angle) * distance, y + Math.sin(piece.angle) * distance, piece.size, piece.size * 0.6);
    });

    context.strokeStyle = this.theme.flameCore;
    context.globalAlpha = Math.max(0, 1 - progress);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, reach * progress * 0.6, 0, Math.PI * 2);
    context.stroke();
  }

  // The game world's warm glow at the bottom, fading as the ship leaves it.
  private drawHorizon(altitude: number): void {
    const { width, height } = this.size;
    const glow = this.context.createLinearGradient(0, height, 0, height * 0.35);

    this.context.globalAlpha = Math.max(0, 1 - altitude * 1.6);
    glow.addColorStop(0, this.theme.horizon);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    this.context.fillStyle = glow;
    this.context.fillRect(0, 0, width, height);
  }

  private drawStars({ stars, altitude }: LaunchState): void {
    const { width, height } = this.size;

    this.context.fillStyle = this.theme.star;
    stars.forEach((star) => {
      // The sky streams down past the ship, nearer stars faster; it wraps so it never runs out.
      const y = ((star.y + altitude * star.depth * CLIMB_SCREENS) % 1) * height;

      this.context.globalAlpha = 0.35 + 0.65 * star.depth * Math.min(1, 0.4 + altitude);
      this.context.fillRect(star.x * width, y, star.size, star.size);
    });
  }

  // The planet's curve rising into view at the very end.
  private drawPlanet(altitude: number): void {
    const { width, height } = this.size;
    const rise = easeInOut((altitude - 0.75) / 0.25);

    if (rise <= 0) {
      return;
    }

    const radius = width * 1.4;
    const top = height * (1.08 - 0.22 * rise);

    this.context.globalAlpha = rise;
    this.context.fillStyle = this.theme.planet;
    this.context.beginPath();
    this.context.arc(width / 2, top + radius, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.strokeStyle = this.theme.window;
    this.context.globalAlpha = 0.5 * rise;
    this.context.lineWidth = 1.5;
    this.context.stroke();
  }

  private drawGround(altitude: number): void {
    const { width, height } = this.size;
    const top = height * 0.86 + altitude * height * CLIMB_SCREENS;

    if (top >= height) {
      return;
    }

    this.context.globalAlpha = 1;
    this.context.fillStyle = this.theme.ground;
    this.context.fillRect(0, top, width, height - top);
  }

  // One band per zone, spread over the climb; each passes below the ship as it is left behind.
  private drawMarkers({ markers, altitude }: LaunchState, shipY: number): void {
    const { width, height } = this.size;

    for (let index = 1; index <= markers; index += 1) {
      const y = shipY - (index / (markers + 1) - altitude) * height * CLIMB_SCREENS;

      if (y > -4 && y < height + 4) {
        const band = this.context.createLinearGradient(0, 0, width, 0);
        const colour = this.theme.markers[(index - 1) % this.theme.markers.length];

        band.addColorStop(0, "rgba(0, 0, 0, 0)");
        band.addColorStop(0.5, colour);
        band.addColorStop(1, "rgba(0, 0, 0, 0)");
        this.context.globalAlpha = 0.55;
        this.context.fillStyle = band;
        this.context.fillRect(0, y, width, 2);
      }
    }
  }

  private drawShip(x: number, y: number, state: LaunchState, now: number): void {
    const context = this.context;
    const thrust = state.status === "launching" ? 1 : state.status === "charging" ? state.charge * 0.7 : 0;

    if (thrust > 0) {
      const flicker = 0.85 + 0.15 * Math.sin(now * 0.05);
      const length = (14 + 30 * thrust) * flicker;
      const flame = context.createLinearGradient(x, y + 14, x, y + 14 + length);

      flame.addColorStop(0, this.theme.flameCore);
      flame.addColorStop(0.4, this.theme.flameEdge);
      flame.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.globalAlpha = 0.9;
      context.fillStyle = flame;
      context.beginPath();
      context.moveTo(x - 6, y + 12);
      context.quadraticCurveTo(x, y + 14 + length * 1.1, x + 6, y + 12);
      context.closePath();
      context.fill();
    }

    context.globalAlpha = 1;
    // Fins first, so the hull sits over them.
    context.fillStyle = this.theme.fin;
    context.beginPath();
    context.moveTo(x - 8, y + 2);
    context.lineTo(x - 15, y + 16);
    context.lineTo(x - 7, y + 13);
    context.moveTo(x + 8, y + 2);
    context.lineTo(x + 15, y + 16);
    context.lineTo(x + 7, y + 13);
    context.fill();

    context.fillStyle = this.theme.hull;
    context.beginPath();
    context.moveTo(x, y - 24);
    context.quadraticCurveTo(x + 10, y - 10, x + 8, y + 14);
    context.lineTo(x - 8, y + 14);
    context.quadraticCurveTo(x - 10, y - 10, x, y - 24);
    context.fill();

    context.fillStyle = this.theme.window;
    context.beginPath();
    context.arc(x, y - 6, 3.5, 0, Math.PI * 2);
    context.fill();
  }
}

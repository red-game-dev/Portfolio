import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";
import { clamp } from "@/packages/math/clamp";

import { BOOST_COLOURS } from "../../config/boosts";
import { activeLevel, boostStrength } from "../../utils/boosts";
import { lerpX, lerpY, VoyageFrame } from "../frame";
import { paintShieldRing } from "../paint/damage";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

// The flare a decoy burns with, and the cool glow of a heat sink.
const FLARE = "rgba(255, 120, 90, 1)";
const FROST = "rgba(125, 249, 255, 1)";
// How fast a block shield's blocks and a gravity well's arms turn (radians a millisecond).
const BLOCK_TURN = 0.0016;
const WELL_TURN = 0.003;
// How far out from the ship a block, the wingman and a sail sit (in ship radii).
const BLOCK_ORBIT = 2.5;
const WINGMAN_SIDE = 2.4;
const SAIL_AHEAD = 2.2;
// A gravity well's dark heart, in world units: small beside a world, so it never reads as a black hole.
const WELL_SIZE = 0.04;

// What the boosts at work look like, round the ship and where they act: a gravity well's dark mass with arms of
// light turning into it, a decoy's flare, a block shield's blocks circling, the wingman's drone alongside, a
// magnetic shield's field lines, an overcharged shield's brighter ring, a heat sink's frost, a solar sail held up to
// the star, a tractor beam to each coin and core in its reach, and bullet time's green cast over everything. The cloak, the afterburner
// and the ion drive change the ship itself, so the ship's layer draws them.
export class BoostsLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "boosts";

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state, world, camera, alpha, now, config } = frame;

    if (state.boosts.length === 0 && !state.well && state.decoy === null) {
      return;
    }

    const { front } = this.kit;
    const context = front.context;

    if (state.well && camera.sees(state.well.x, state.well.y, 1)) {
      this.drawWell(camera.toScreenX(state.well.x), camera.toScreenY(state.well.y), clamp(camera.scale * WELL_SIZE, 8, 22), now);
    }

    const decoy = state.decoy !== null ? world.stores.body.get(state.decoy) : undefined;

    if (decoy) {
      const flare = this.kit.cache.get(`glow:${FLARE}`, 64, 64, paintGlow(FLARE));
      const flicker = 0.8 + Math.sin(now * 0.04) * 0.2;
      const size = Math.max(14, camera.scale * 0.5) * flicker;

      context.globalCompositeOperation = "lighter";
      front.blit(flare, camera.toScreenX(lerpX(decoy, alpha)), camera.toScreenY(lerpY(decoy, alpha)), size, size);
      context.globalCompositeOperation = "source-over";
    }

    const body = world.stores.body.get(state.ship);
    const ship = world.stores.ship.get(state.ship);

    if (!body || !ship || state.phase === "lost") {
      return;
    }

    const x = camera.toScreenX(lerpX(body, alpha));
    const y = camera.toScreenY(lerpY(body, alpha));
    const r = body.radius * camera.scale;
    const angle = ship.angle;

    if (activeLevel(state, "bulletTime") > 0) {
      context.fillStyle = "rgba(75, 255, 165, 0.06)";
      context.fillRect(0, 0, front.width, front.height);
    }

    const tractor = activeLevel(state, "tractor");

    if (tractor > 0) {
      this.drawBeams(frame, x, y, config.pickups.magnet * boostStrength("tractor", tractor));
    }

    if (activeLevel(state, "solarSail") > 0) {
      this.drawSail(x, y, r, Math.atan2(body.y - state.system.star.y, body.x - state.system.star.x));
    }

    context.globalCompositeOperation = "lighter";

    if (activeLevel(state, "overcharge") > 0) {
      const ring = this.kit.cache.get(`shield:${this.kit.theme.shield}`, 128, 128, paintShieldRing(this.kit.theme.shield));

      context.globalAlpha = 0.4 + Math.sin(now * 0.012) * 0.12;
      front.blit(ring, x, y, r * 4.8, r * 4.8);
    }

    if (activeLevel(state, "heatSink") > 0) {
      const frost = this.kit.cache.get(`glow:${FROST}`, 64, 64, paintGlow(FROST));

      context.globalAlpha = 0.22;
      front.blit(frost, x, y, r * 3.2, r * 3.2);
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";

    if (activeLevel(state, "magneticShield") > 0) {
      context.strokeStyle = BOOST_COLOURS.solar;
      context.lineWidth = 1.2;
      context.globalAlpha = 0.45;

      for (let line = 0; line < 2; line += 1) {
        context.beginPath();
        context.ellipse(x, y, r * (3.4 + line * 0.9), r * (1.5 + line * 0.5), angle + now * 0.0004, 0, TAU);
        context.stroke();
      }

      context.globalAlpha = 1;
    }

    if (state.blocks > 0) {
      this.drawBlocks(x, y, r, state.blocks, now);
    }

    if (activeLevel(state, "wingman") > 0) {
      this.drawWingman(x, y, r, angle, now);
    }
  }

  // A faint beam to each coin and core on screen that the tractor is drawing in, within its reach (world units).
  private drawBeams({ state, world, camera, alpha, now }: VoyageFrame, x: number, y: number, reach: number): void {
    const context = this.kit.front.context;
    const ship = world.stores.body.get(state.ship);
    const pickups = world.stores.pickup;

    if (!ship) {
      return;
    }

    context.strokeStyle = BOOST_COLOURS.anywhere;
    context.lineWidth = 1;
    context.globalAlpha = 0.3 + Math.sin(now * 0.01) * 0.1;
    context.beginPath();

    pickups.entities.forEach((entity, index) => {
      const { kind } = pickups.values[index];
      const body = world.stores.body.get(entity);

      // Only coins and cores are drawn in; the other pickups wait to be flown through.
      const isDrawn = kind === "coin" || kind === "boost" || kind === "cache";

      if (isDrawn && body && camera.sees(body.x, body.y, body.radius) && Math.hypot(body.x - ship.x, body.y - ship.y) <= reach) {
        context.moveTo(x, y);
        context.lineTo(camera.toScreenX(lerpX(body, alpha)), camera.toScreenY(lerpY(body, alpha)));
      }
    });

    context.stroke();
    context.globalAlpha = 1;
  }

  // A dark mass with arms of the abyss's light turning into it.
  private drawWell(x: number, y: number, size: number, now: number): void {
    const { front } = this.kit;
    const context = front.context;
    const colour = BOOST_COLOURS.abyss;
    const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 0.5;
    front.blit(glow, x, y, size * 5, size * 5);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.85;
    context.strokeStyle = colour;
    context.lineWidth = 1.5;

    for (let arm = 0; arm < 3; arm += 1) {
      const start = now * WELL_TURN + (arm * TAU) / 3;

      context.beginPath();
      context.arc(x, y, size * 1.9, start, start + 1.4);
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = "#02040a";
    context.beginPath();
    context.arc(x, y, size, 0, TAU);
    context.fill();
  }

  // Each block still standing, circling the ship.
  private drawBlocks(x: number, y: number, r: number, count: number, now: number): void {
    const context = this.kit.front.context;
    const side = Math.max(4, r * 0.5);

    context.fillStyle = BOOST_COLOURS.blocks;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1;

    for (let block = 0; block < count; block += 1) {
      const turn = now * BLOCK_TURN + (block * TAU) / count;
      const bx = x + Math.cos(turn) * r * BLOCK_ORBIT;
      const by = y + Math.sin(turn) * r * BLOCK_ORBIT;

      context.globalAlpha = 0.85;
      context.fillRect(bx - side / 2, by - side / 2, side, side);
      context.globalAlpha = 0.6;
      context.strokeRect(bx - side / 2, by - side / 2, side, side);
    }

    context.globalAlpha = 1;
  }

  // A small drone off the ship's right side, bobbing, pointing where the ship points.
  private drawWingman(x: number, y: number, r: number, angle: number, now: number): void {
    const { front } = this.kit;
    const context = front.context;
    const colour = BOOST_COLOURS.neural;
    const side = angle + Math.PI / 2;
    const bob = Math.sin(now * 0.004) * r * 0.3;
    const dx = x + Math.cos(side) * r * WINGMAN_SIDE - Math.cos(angle) * (r * 0.6 + bob);
    const dy = y + Math.sin(side) * r * WINGMAN_SIDE - Math.sin(angle) * (r * 0.6 + bob);
    const size = Math.max(4, r * 0.55);
    const glow = this.kit.cache.get(`glow:${colour}`, 64, 64, paintGlow(colour));

    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 0.5;
    front.blit(glow, dx, dy, size * 3, size * 3);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = colour;
    context.beginPath();
    context.moveTo(dx + Math.cos(angle) * size, dy + Math.sin(angle) * size);
    context.lineTo(dx + Math.cos(angle + 2.5) * size * 0.8, dy + Math.sin(angle + 2.5) * size * 0.8);
    context.lineTo(dx + Math.cos(angle - 2.5) * size * 0.8, dy + Math.sin(angle - 2.5) * size * 0.8);
    context.closePath();
    context.fill();
  }

  // A thin gold sheet held up across the starlight, rigged to the ship.
  private drawSail(x: number, y: number, r: number, away: number): void {
    const context = this.kit.front.context;
    const across = away + Math.PI / 2;
    const cx = x + Math.cos(away) * r * SAIL_AHEAD;
    const cy = y + Math.sin(away) * r * SAIL_AHEAD;
    const half = r * 1.8;
    const ax = cx + Math.cos(across) * half;
    const ay = cy + Math.sin(across) * half;
    const bx = cx - Math.cos(across) * half;
    const by = cy - Math.sin(across) * half;

    context.strokeStyle = BOOST_COLOURS.solar;
    context.lineWidth = 1;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(ax, ay);
    context.moveTo(x, y);
    context.lineTo(bx, by);
    context.stroke();
    context.globalAlpha = 0.85;
    context.lineWidth = Math.max(2, r * 0.25);
    context.beginPath();
    context.moveTo(ax, ay);
    context.quadraticCurveTo(cx + Math.cos(away) * r * 0.6, cy + Math.sin(away) * r * 0.6, bx, by);
    context.stroke();
    context.globalAlpha = 1;
  }
}

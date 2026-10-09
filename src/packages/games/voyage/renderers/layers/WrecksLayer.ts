import type { RenderLayer } from "@/packages/games/engine";
import type { Canvas2DContext, DrawableSurface } from "@/packages/graphics/canvas";
import { createSeededRandom } from "@/packages/math/random";

import { Wreck } from "../../domain/components";
import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { CraftShape, paintCraft } from "../paint/aliens";
import { paintRock } from "../paint/hazards";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

const TAU = Math.PI * 2;
// Ours, and the hulks of those with no colours of their own.
const OURS: [string, string, string] = ["#8a92a8", "#2a3350", "rgba(255, 200, 120, 1)"];
// Each wreck is drawn in one of a few broken variants, chosen by its seed.
const VARIANTS = 4;
const SALVAGE = "#7dffcf";
const LOOT = "#ffd76a";

// A lost probe: a box with its dish and two long solar wings, nose to the right.
const paintProbe = (context: Canvas2DContext, width: number) => {
  const c = width / 2;
  const r = width * 0.46;

  context.fillStyle = "#2b3a5c";
  context.fillRect(c - r * 0.95, c - r * 0.12, r * 0.6, r * 0.24);
  context.fillRect(c + r * 0.35, c - r * 0.12, r * 0.6, r * 0.24);
  context.strokeStyle = "#5a6a8a";
  context.lineWidth = Math.max(1, r * 0.02);

  for (let index = 0; index < 4; index += 1) {
    context.strokeRect(c - r * 0.95 + index * r * 0.15, c - r * 0.12, r * 0.15, r * 0.24);
    context.strokeRect(c + r * 0.35 + index * r * 0.15, c - r * 0.12, r * 0.15, r * 0.24);
  }

  context.fillStyle = "#c9a85a";
  context.fillRect(c - r * 0.3, c - r * 0.25, r * 0.6, r * 0.5);
  context.fillStyle = "#d9dde6";
  context.beginPath();
  context.ellipse(c + r * 0.05, c, r * 0.12, r * 0.4, 0, 0, TAU);
  context.fill();
};

// A wreck's sprite: the craft it was, burned dark, scorched and with a bite torn from its hull.
const paintWreck = (shape: CraftShape | "probe", colours: [string, string, string], variant: number) => (context: Canvas2DContext, width: number) => {
  const random = createSeededRandom(variant * 97 + 13);
  const c = width / 2;

  if (shape === "probe") {
    paintProbe(context, width);
  } else {
    paintCraft(shape, colours)(context, width);
  }

  context.globalCompositeOperation = "source-atop";
  context.fillStyle = "rgba(18, 14, 12, 0.55)";
  context.fillRect(0, 0, width, width);

  for (let index = 0; index < 3; index += 1) {
    const scorch = context.createRadialGradient(c + (random() - 0.5) * width * 0.5, c + (random() - 0.5) * width * 0.3, 0, c, c, width * 0.3);

    scorch.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    scorch.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = scorch;
    context.fillRect(0, 0, width, width);
  }

  context.globalCompositeOperation = "destination-out";
  context.beginPath();

  const biteX = c + (random() - 0.5) * width * 0.5;
  const biteY = c + (random() < 0.5 ? -1 : 1) * width * 0.18;

  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * TAU;
    const reach = width * (0.06 + random() * 0.08);

    context[index === 0 ? "moveTo" : "lineTo"](biteX + Math.cos(angle) * reach, biteY + Math.sin(angle) * reach);
  }

  context.closePath();
  context.fill();
  context.globalCompositeOperation = "source-over";
};

// The dead adrift: lost probes, spent rockets, old starships and the hulks of the fallen, burned and tumbling;
// ore and ice where rocks were shot apart. Anything still holding something winks gold now and then; one being
// salvaged is held in a tractor beam from the ship, with a ring round it filling as the work goes on.
export class WrecksLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "wrecks";

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state, world } = frame;

    if (state.phase === "lost" || world.stores.wreck.size === 0) {
      return;
    }

    world.stores.wreck.entities.forEach((entity, index) => this.drawWreck(frame, entity, world.stores.wreck.values[index]));

    if (state.salvage) {
      this.drawBeam(frame, state.salvage.wreck, state.salvage.progress);
    }
  }

  private drawWreck(frame: VoyageFrame, entity: number, wreck: Wreck): void {
    const { world, camera, alpha, now, state } = frame;
    const body = world.stores.body.get(entity);
    const spin = world.stores.spin.get(entity);

    if (!body || !camera.sees(body.x, body.y, body.radius * 3)) {
      return;
    }

    const { front } = this.kit;
    const x = camera.toScreenX(lerpX(body, alpha));
    const y = camera.toScreenY(lerpY(body, alpha));
    const drawn = body.radius * 2.4 * camera.scale;
    const size = sizeBucket(body.radius * 2.4 * (camera.scale / camera.zoom));
    const sprite = this.sprite(wreck, size, state.cosmos?.factions[wreck.faction]);

    front.context.globalAlpha = wreck.isEmpty ? 0.55 : 1;
    front.blit(sprite, x, y, drawn, drawn, spin?.angle ?? 0);
    front.context.globalAlpha = 1;

    if (!wreck.isEmpty) {
      // A wink of something still aboard, on a rhythm of its own.
      const wink = Math.max(0, Math.sin(now * 0.004 + wreck.seed * 40)) ** 6;

      if (wink > 0.02) {
        const glint = this.kit.cache.get(`glow:${LOOT}`, 64, 64, paintGlow(LOOT));

        front.context.globalCompositeOperation = "lighter";
        front.context.globalAlpha = wink;
        front.blit(glint, x, y, Math.max(10, drawn * 0.7), Math.max(10, drawn * 0.7));
        front.context.globalAlpha = 1;
        front.context.globalCompositeOperation = "source-over";
      }
    }
  }

  private sprite(wreck: Wreck, size: number, faction: { shape: CraftShape; colours: [string, string, string] } | undefined): DrawableSurface | null {
    const variant = Math.floor(wreck.seed * VARIANTS);

    if (wreck.kind === "ore" || wreck.kind === "ice") {
      return this.kit.sprite(`wreck:${wreck.kind}:${variant}:${size}`, size, size, paintRock(variant + 11, wreck.kind === "ice"));
    }

    const shape: CraftShape | "probe" = wreck.kind === "alien" ? faction?.shape ?? "saucer" : wreck.kind;
    const colours = wreck.kind === "alien" ? faction?.colours ?? OURS : OURS;

    return this.kit.sprite(`wreck:${shape}:${colours.join()}:${variant}:${size}`, size, size, paintWreck(shape, colours, variant));
  }

  // The tractor beam from the ship to the wreck, its light running towards the ship, and a ring of progress.
  private drawBeam({ world, camera, alpha, state, now }: VoyageFrame, entity: number, progress: number): void {
    const wreck = world.stores.body.get(entity);
    const ship = world.stores.body.get(state.ship);

    if (!wreck || !ship) {
      return;
    }

    const context = this.kit.front.context;
    const sx = camera.toScreenX(lerpX(ship, alpha));
    const sy = camera.toScreenY(lerpY(ship, alpha));
    const wx = camera.toScreenX(lerpX(wreck, alpha));
    const wy = camera.toScreenY(lerpY(wreck, alpha));
    const ring = wreck.radius * 1.5 * camera.scale + 6;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.strokeStyle = SALVAGE;
    context.globalAlpha = 0.25;
    context.lineWidth = Math.max(3, wreck.radius * camera.scale * 0.8);
    context.beginPath();
    context.moveTo(sx, sy);
    context.lineTo(wx, wy);
    context.stroke();
    context.globalAlpha = 0.8;
    context.lineWidth = 1.5;
    context.setLineDash([6, 8]);
    context.lineDashOffset = now * 0.03;
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 0.9;
    context.lineWidth = 2.5;
    context.beginPath();
    context.arc(wx, wy, ring, -Math.PI / 2, -Math.PI / 2 + progress * TAU);
    context.stroke();
    context.restore();
  }
}

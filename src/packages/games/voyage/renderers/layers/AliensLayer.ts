import type { RenderLayer } from "@/packages/games/engine";

import { Alien } from "../../domain/components";
import { FactionSpec } from "../../domain/universe";
import { lerpX, lerpY, sizeBucket, VoyageFrame } from "../frame";
import { paintCraft } from "../paint/aliens";
import { paintRock } from "../paint/hazards";
import { paintGlow } from "../paint/space";
import { RenderKit } from "./kit";

const TAU = Math.PI * 2;
// MMO colours for how someone stands towards the ship.
const STANDING = { aggro: "#ff4d5e", hostile: "#ff8a5c", territorial: "#ffb347", neutral: "#ffd76a", peaceful: "#6ee7a8" };
const SHIELD = "#4fd8ff";
// Whales and traders, who have no faction colours of their own.
const WHALE: [string, string, string] = ["#1c2a44", "#3a5a8a", "rgba(120, 220, 255, 1)"];
const OURS: [string, string, string] = ["#9aa3bb", "#2a3350", "rgba(255, 200, 120, 1)"];

// Everyone who lives or passes through, and the rocks headed for worlds: each craft turned to its heading, a
// nameplate over it as in an MMO (level, hull and shield, coloured by how it stands towards the ship: red once
// it is coming for the ship), a whale's slow glow, a passing ship's exhaust, a rock's path to the world it will
// hit with its strength, and the reticle on whatever the guns are locked onto.
export class AliensLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "aliens";

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state, world } = frame;

    if (state.phase === "lost") {
      return;
    }

    world.stores.traffic.entities.forEach((entity, index) => this.drawTraffic(frame, entity, world.stores.traffic.values[index].kind));
    world.stores.impactor.entities.forEach((entity) => this.drawImpactor(frame, entity));
    world.stores.alien.entities.forEach((entity, index) => this.drawAlien(frame, entity, world.stores.alien.values[index]));

    if (state.lockedTarget !== null) {
      this.drawReticle(frame, state.lockedTarget);
    }
  }

  private drawAlien(frame: VoyageFrame, entity: number, alien: Alien): void {
    const { world, camera, alpha, state, now } = frame;
    const body = world.stores.body.get(entity);
    const health = world.stores.health.get(entity);

    if (!body || !health || !camera.sees(body.x, body.y, body.radius * 3)) {
      return;
    }

    const { front } = this.kit;
    const faction = alien.faction >= 0 ? state.cosmos?.factions[alien.faction] : undefined;
    const shape = alien.role === "whale" ? "whale" : alien.role === "trader" ? "trader" : faction?.shape ?? "saucer";
    const colours = alien.role === "whale" ? WHALE : faction?.colours ?? OURS;
    const base = camera.scale / camera.zoom;
    const size = sizeBucket(body.radius * 2.4 * base);
    const sprite = this.kit.sprite(`craft:${shape}:${colours.join()}:${alien.role}:${size}`, size, size, paintCraft(shape, colours, alien.role === "boss"));
    const x = camera.toScreenX(lerpX(body, alpha));
    const y = camera.toScreenY(lerpY(body, alpha));
    const drawn = body.radius * 2.4 * camera.scale;
    const bob = alien.role === "whale" ? Math.sin(now * 0.0012 + entity) * drawn * 0.03 : 0;

    front.blit(sprite, x, y + bob, drawn, drawn, alien.angle);

    if (alien.mode === "evade") {
      front.context.globalAlpha = 0.35;
      front.blit(sprite, x, y, drawn * 1.15, drawn * 1.15, alien.angle);
      front.context.globalAlpha = 1;
    }

    this.drawPlate(x, y - drawn * 0.62, alien, faction, health.hull / health.maxHull, health.maxShields > 0 ? health.shields / health.maxShields : 0);
  }

  // A nameplate as an MMO draws one: the level in its colour, a hull bar, a shield bar under it when there is one.
  private drawPlate(x: number, y: number, alien: Alien, faction: FactionSpec | undefined, hull: number, shields: number): void {
    const { front } = this.kit;
    const context = front.context;
    const width = alien.role === "boss" ? 70 : alien.role === "whale" ? 46 : 34;
    const colour = alien.threat > 0 && alien.mode !== "evade" ? STANDING.aggro : STANDING[faction?.disposition ?? "peaceful"];

    context.fillStyle = "rgba(5, 8, 18, 0.7)";
    context.fillRect(x - width / 2 - 1, y - 1, width + 2, shields > 0 ? 7 : 5);
    context.fillStyle = colour;
    context.fillRect(x - width / 2, y, width * Math.max(0, hull), 3);

    if (shields > 0) {
      context.fillStyle = SHIELD;
      context.fillRect(x - width / 2, y + 4, width * shields, 2);
    }

    context.font = "bold 10px Roboto, Arial, sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = colour;
    context.fillText(String(alien.level), x - width / 2 - 4, y + 2);
  }

  private drawTraffic({ world, camera, alpha }: VoyageFrame, entity: number, kind: "rocket" | "starship" | "freighter"): void {
    const body = world.stores.body.get(entity);

    if (!body || !camera.sees(body.x, body.y, body.radius * 3)) {
      return;
    }

    const { front, particles } = this.kit;
    const shape = kind === "freighter" ? "trader" : kind;
    const base = camera.scale / camera.zoom;
    const size = sizeBucket(body.radius * 2.6 * base);
    const sprite = this.kit.sprite(`craft:${shape}:${size}`, size, size, paintCraft(shape, ["#c9ced8", "#2a3350", "rgba(255, 200, 120, 1)"]));
    const angle = Math.atan2(body.vy, body.vx);
    const x = lerpX(body, alpha);
    const y = lerpY(body, alpha);
    const exhaust = this.kit.cache.get("glow:rgba(255, 176, 58, 1)", 64, 64, paintGlow("rgba(255, 176, 58, 1)"));

    if (Math.random() < 0.6) {
      particles.emit("glow", x - Math.cos(angle) * body.radius, y - Math.sin(angle) * body.radius, -Math.cos(angle) * 0.4, -Math.sin(angle) * 0.4, 0.5,
        body.radius * 0.6, exhaust, { drag: 1.5, grow: -body.radius * 0.5 });
    }

    front.blit(sprite, camera.toScreenX(x), camera.toScreenY(y), body.radius * 2.6 * camera.scale, body.radius * 2.6 * camera.scale, angle);
  }

  private drawImpactor({ world, camera, alpha, state }: VoyageFrame, entity: number): void {
    const body = world.stores.body.get(entity);
    const impactor = world.stores.impactor.get(entity);
    const target = impactor ? state.system.bodies.find((candidate) => candidate.id === impactor.target) : undefined;

    if (!body || !impactor) {
      return;
    }

    const { front } = this.kit;
    const context = front.context;
    const x = camera.toScreenX(lerpX(body, alpha));
    const y = camera.toScreenY(lerpY(body, alpha));

    // Its path to the world it will hit, while it is still on course.
    if (target && impactor.isOnCourse) {
      context.setLineDash([5, 7]);
      context.strokeStyle = "rgba(255, 90, 90, 0.55)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(camera.toScreenX(target.x), camera.toScreenY(target.y));
      context.stroke();
      context.setLineDash([]);
    }

    if (!camera.sees(body.x, body.y, body.radius * 2)) {
      return;
    }

    const base = camera.scale / camera.zoom;
    const size = sizeBucket(body.radius * 2.4 * base);
    const spin = world.stores.spin.get(entity)?.angle ?? 0;
    const drawn = body.radius * 2.4 * camera.scale;
    const heat = this.kit.cache.get("glow:rgba(255, 110, 60, 1)", 64, 64, paintGlow("rgba(255, 110, 60, 1)"));

    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 0.35;
    front.blit(heat, x, y, drawn * 1.8, drawn * 1.8);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    front.blit(this.kit.sprite(`rock:${entity % 6}:false:${size}`, size, size, paintRock(entity % 6, false)), x, y, drawn, drawn, spin);

    const width = Math.max(30, Math.min(90, drawn));

    context.fillStyle = "rgba(5, 8, 18, 0.7)";
    context.fillRect(x - width / 2 - 1, y - drawn * 0.6 - 6, width + 2, 5);
    context.fillStyle = impactor.isOnCourse ? STANDING.aggro : STANDING.neutral;
    context.fillRect(x - width / 2, y - drawn * 0.6 - 5, width * Math.max(0, impactor.hp / impactor.maxHp), 3);
  }

  private drawReticle({ world, camera, alpha, now }: VoyageFrame, entity: number): void {
    const body = world.stores.body.get(entity);

    if (!body) {
      return;
    }

    const context = this.kit.front.context;
    const x = camera.toScreenX(lerpX(body, alpha));
    const y = camera.toScreenY(lerpY(body, alpha));
    const radius = Math.max(14, body.radius * camera.scale * 1.5) + Math.sin(now * 0.008) * 2;

    context.strokeStyle = "#ff4d5e";
    context.lineWidth = 1.5;

    for (let quarter = 0; quarter < 4; quarter += 1) {
      const start = (quarter / 4) * TAU + 0.25;

      context.beginPath();
      context.arc(x, y, radius, start, start + 1);
      context.stroke();
    }
  }
}

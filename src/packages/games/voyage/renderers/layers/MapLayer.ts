import type { RenderLayer } from "@/packages/games/engine";
import { TAU } from "@/packages/math/angles";

import { VoyageFrame } from "../frame";
import { Surface } from "../Surface";
import { RenderKit } from "./kit";

// The radar in the corner: its radius in CSS pixels (smaller on narrow screens) and how far it sees (world units).
const RADAR_RADIUS = 58;
const RADAR_RADIUS_NARROW = 44;
const RADAR_RANGE = 9;
const RADAR_MARGIN = 14;
const LABEL_FONT = "11px Roboto, Arial, sans-serif";
const RADAR_STANDING = { hostile: "#ff8a5c", territorial: "#ffb347", neutral: "#ffd76a", peaceful: "#6ee7a8" };
const INK = "#c4d2ff";

// The ship as a small arrow pointing where it is pointed.
const drawArrow = (surface: Surface, x: number, y: number, angle: number, size: number, colour: string) => {
  surface.frame(x, y, angle);
  surface.context.fillStyle = colour;
  surface.context.beginPath();
  surface.context.moveTo(size, 0);
  surface.context.lineTo(-size * 0.7, -size * 0.6);
  surface.context.lineTo(-size * 0.35, 0);
  surface.context.lineTo(-size * 0.7, size * 0.6);
  surface.context.closePath();
  surface.context.fill();
  surface.reset();
};

// Room left at the top of the map for the HUD over it (CSS pixels), where the black hole's note stands while its
// ring is beyond the top of the map.
const MAP_TOP_ROOM = 150;

// The way to find things: a small radar in the corner of what is near (and an arrow towards the star), and on
// request a map of the whole system over the view, every orbit drawn through where each body really is now,
// the belts, the edge where the black hole waits, the storms on their way out, and the ship with a line to the
// next stop.
export class MapLayer implements RenderLayer<VoyageFrame> {
  public readonly name = "map";
  public isOpen = false;
  // Off in photo mode, radar and map both; the radar alone while the ship stands on a world.
  public isHidden = false;
  public hidesRadar = false;

  constructor(private readonly kit: RenderKit) {}

  public draw(frame: VoyageFrame): void {
    const { state } = frame;

    if (state.phase === "lost" || state.status === "ready" || this.isHidden) {
      return;
    }

    if (this.isOpen) {
      this.drawMap(frame);
    } else if (state.status === "flying" && !this.hidesRadar) {
      this.drawRadar(frame);
    }
  }

  private drawMap({ state, world, alpha, theme }: VoyageFrame): void {
    const { front, labels } = this.kit;
    const ship = world.stores.body.get(state.ship);
    const shipState = world.stores.ship.get(state.ship);
    const context = front.context;
    const inSystem = state.phase !== "lost";
    const cx = front.width / 2;
    const cy = front.height / 2;

    context.fillStyle = "rgba(2, 4, 10, 0.96)";
    context.fillRect(0, 0, front.width, front.height);

    if (!ship) {
      return;
    }

    const shipX = ship.prevX + (ship.x - ship.prevX) * alpha;
    const shipY = ship.prevY + (ship.y - ship.prevY) * alpha;
    const { system } = state;
    const centreX = inSystem ? system.star.x : shipX;
    const centreY = inSystem ? system.star.y : shipY;
    const reach = inSystem ? Math.min(system.edge * 1.06, Math.max(32, Math.hypot(shipX - centreX, shipY - centreY) * 1.25)) : 16;
    const scale = (Math.min(front.width, front.height) / 2) * 0.88 / reach;
    const toX = (x: number) => cx + (x - centreX) * scale;
    const toY = (y: number) => cy + (y - centreY) * scale;

    context.font = LABEL_FONT;
    context.textAlign = "center";
    context.textBaseline = "top";

    if (inSystem) {
      system.belts.forEach((belt) => {
        context.fillStyle = belt.isIcy ? "rgba(150, 190, 230, 0.07)" : "rgba(200, 180, 150, 0.09)";
        context.beginPath();
        context.arc(cx, cy, belt.outer * scale, 0, TAU);
        context.arc(cx, cy, belt.inner * scale, 0, TAU, true);
        context.fill();
      });

      context.setLineDash([4, 6]);
      context.strokeStyle = "rgba(255, 120, 90, 0.55)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(cx, cy, system.edge * scale, 0, TAU);
      context.stroke();
      context.setLineDash([]);

      // Where the black hole waits: past this ring, in whichever direction the ship crosses it. While the ring
      // is still off the map, the note stands at the top of it instead.
      const edgeNote = this.kit.labels.edgeNote;

      if (edgeNote && state.phase === "solar") {
        const ringTop = cy - system.edge * scale - 4;
        const top = MAP_TOP_ROOM;

        context.save();
        context.fillStyle = "rgba(255, 150, 120, 0.95)";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(edgeNote, cx, ringTop > top ? ringTop : top);
        context.restore();
      }

      system.bodies.forEach((body) => {
        if (body.kind === "moon") {
          return;
        }

        context.strokeStyle = state.passed.has(body.id) ? "rgba(196, 210, 255, 0.28)" : "rgba(196, 210, 255, 0.12)";
        context.beginPath();
        context.arc(cx, cy, Math.hypot(body.x - system.star.x, body.y - system.star.y) * scale, 0, TAU);
        context.stroke();
      });

      state.storms.forEach((storm) => {
        context.strokeStyle = `rgba(255, 170, 90, ${0.3 + storm.strength * 0.5})`;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(cx, cy, storm.radius * scale, storm.angle - storm.width / 2, storm.angle + storm.width / 2);
        context.stroke();
      });

      if (system.star.luminosity > 0) {
        context.fillStyle = "#ffd27a";
        context.beginPath();
        context.arc(cx, cy, Math.max(4, system.star.radius * scale), 0, TAU);
        context.fill();
      }

      system.bodies.forEach((body) => {
        if (body.kind === "moon" && scale < 6) {
          return;
        }

        const x = toX(body.x);
        const y = toY(body.y);
        const radius = Math.max(body.kind === "moon" ? 1.5 : 2.5, body.radius * scale);

        if (body.isShattered) {
          return;
        }

        context.fillStyle = (theme.bodies[body.id] ?? state.cosmos?.looks[body.id])?.surface.palette[2] ?? INK;
        context.beginPath();
        context.arc(x, y, radius, 0, TAU);
        context.fill();

        if (body.kind !== "moon") {
          context.fillStyle = state.passed.has(body.id) ? INK : "rgba(196, 210, 255, 0.6)";
          context.fillText(labels[body.id] ?? state.cosmos?.names[body.id] ?? body.id, x, y + radius + 3);
        }
      });
    }

    world.stores.hole.entities.forEach((entity) => {
      const hole = world.stores.body.get(entity);

      if (hole) {
        context.fillStyle = "#000000";
        context.strokeStyle = theme.disk;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(toX(hole.x), toY(hole.y), 5, 0, TAU);
        context.fill();
        context.stroke();
      }
    });

    if (state.waypoint) {
      context.setLineDash([3, 5]);
      context.strokeStyle = "rgba(196, 210, 255, 0.5)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(toX(shipX), toY(shipY));
      context.lineTo(toX(state.waypoint.x), toY(state.waypoint.y));
      context.stroke();
      context.setLineDash([]);
    }

    drawArrow(front, toX(shipX), toY(shipY), shipState?.angle ?? 0, 8, theme.shield);
  }

  private drawRadar({ state, world, alpha, theme }: VoyageFrame): void {
    const { front } = this.kit;
    const ship = world.stores.body.get(state.ship);
    const shipState = world.stores.ship.get(state.ship);

    if (!ship) {
      return;
    }

    const context = front.context;
    const radius = front.width < 640 ? RADAR_RADIUS_NARROW : RADAR_RADIUS;
    const cx = RADAR_MARGIN + radius;
    const cy = front.height - RADAR_MARGIN - radius;
    const scale = radius / RADAR_RANGE;
    const shipX = ship.prevX + (ship.x - ship.prevX) * alpha;
    const shipY = ship.prevY + (ship.y - ship.prevY) * alpha;
    const inSystem = state.phase !== "lost";
    const plot = (x: number, y: number, size: number, colour: string) => {
      const dx = (x - shipX) * scale;
      const dy = (y - shipY) * scale;

      if (dx * dx + dy * dy < radius * radius) {
        context.fillStyle = colour;
        context.beginPath();
        context.arc(cx + dx, cy + dy, size, 0, TAU);
        context.fill();
      }
    };

    context.fillStyle = "rgba(5, 8, 18, 0.62)";
    context.strokeStyle = "rgba(196, 210, 255, 0.25)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(cx, cy, radius, 0, TAU);
    context.fill();
    context.stroke();
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, TAU);
    context.clip();

    world.stores.hazard.entities.forEach((entity, index) => {
      const rock = world.stores.body.get(entity);

      if (rock) {
        plot(rock.x, rock.y, world.stores.hazard.values[index].isComet ? 2.4 : 1.2, world.stores.hazard.values[index].isComet ? "#bfe0ff" : "rgba(220, 200, 170, 0.75)");
      }
    });

    world.stores.pickup.entities.forEach((entity) => {
      const item = world.stores.body.get(entity);

      if (item) {
        plot(item.x, item.y, 1.6, "#ffd76a");
      }
    });

    if (inSystem) {
      state.system.bodies.forEach((body) => {
        if (!body.isShattered) {
          plot(body.x, body.y, Math.max(2, body.radius * scale), (theme.bodies[body.id] ?? state.cosmos?.looks[body.id])?.surface.palette[2] ?? INK);
        }
      });
    }

    world.stores.hole.entities.forEach((entity) => {
      const hole = world.stores.body.get(entity);

      if (hole) {
        plot(hole.x, hole.y, 3.5, theme.disk);
      }
    });

    // Who lives here, coloured as their nameplates are: red once coming for the ship.
    world.stores.alien.entities.forEach((entity, index) => {
      const alien = world.stores.alien.values[index];
      const at = world.stores.body.get(entity);
      const disposition = alien.faction >= 0 ? state.cosmos?.factions[alien.faction]?.disposition : "peaceful";

      if (at) {
        plot(at.x, at.y, alien.role === "boss" ? 3.6 : alien.role === "whale" ? 3 : 2, alien.threat > 0 ? "#ff4d5e" : RADAR_STANDING[disposition ?? "peaceful"]);
      }
    });

    world.stores.impactor.entities.forEach((entity) => {
      const at = world.stores.body.get(entity);

      if (at) {
        plot(at.x, at.y, 2.6, "#ff8a5c");
      }
    });

    // Wrecks: gold while they still hold something, grey once stripped.
    world.stores.wreck.entities.forEach((entity, index) => {
      const at = world.stores.body.get(entity);

      if (at) {
        plot(at.x, at.y, 1.8, world.stores.wreck.values[index].isEmpty ? "#5a6070" : "#ffd76a");
      }
    });

    context.restore();

    if (inSystem && state.system.star.luminosity > 0) {
      const { star } = state.system;
      const angle = Math.atan2(star.y - shipY, star.x - shipX);

      drawArrow(front, cx + Math.cos(angle) * (radius - 6), cy + Math.sin(angle) * (radius - 6), angle, 5, "#ffd27a");
    }

    drawArrow(front, cx, cy, shipState?.angle ?? 0, 5, theme.shield);
  }
}

import { Canvas2DContext } from "@/packages/graphics/canvas";
import { hexWithAlpha } from "@/packages/graphics/colour";
import { TAU } from "@/packages/math/angles";
import { fill, formatNumber } from "@/packages/text/format";

import { MissionMarks } from "../../utils/missions";
import { radiusForAu } from "../../utils/scale";
import { lerpX, lerpY, VoyageFrame } from "../frame";

// The map's view of the world: where a world point lands on it (CSS pixels), and how many pixels a world unit is.
export interface MapView {
  context: Canvas2DContext;
  toX: (x: number) => number;
  toY: (y: number) => number;
  scale: number;
  labels: Record<string, string>;
}

// What the map showed this time, so its key lists only what is there.
export interface MapSeen {
  mission: boolean;
  pull: boolean;
  hostile: boolean;
  rock: boolean;
  hazard: boolean;
}

const MISSION = "#ffd76a";
const PULL = "#ff6a5c";
const STANDING = { hostile: "#ff6a5c", territorial: "#ffb347", neutral: "#ffd76a", peaceful: "#6ee7a8" };
const HAZARD = "#ff9df0";

// A mission's mark: a gold diamond round the place.
const diamond = (context: Canvas2DContext, x: number, y: number, size: number) => {
  context.beginPath();
  context.moveTo(x, y - size);
  context.lineTo(x + size, y);
  context.lineTo(x, y + size);
  context.lineTo(x - size, y);
  context.closePath();
  context.stroke();
};

// Who lives on each world: a ring in the colour of how they meet visitors, red where the ground opens fire.
export const paintPeoples = ({ context, toX, toY, scale }: MapView, { state }: VoyageFrame): void => {
  const { cosmos } = state;

  if (!cosmos) {
    return;
  }

  state.system.bodies.forEach((body) => {
    const faction = cosmos.factions.find((living) => living.id === cosmos.inhabitants[body.id]);

    if (faction && !body.isShattered) {
      context.strokeStyle = STANDING[faction.disposition];
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(toX(body.x), toY(body.y), Math.max(5, body.radius * scale) + 3, 0, TAU);
      context.stroke();
    }
  });
};

// A universe's strange things where they are: a nebula's or magnetar's reach, a pulsar's beam, a quasar's jet, a
// gamma ray burst lined up, a supernova and its shock, and a wormhole's two mouths.
export const paintPhenomena = ({ context, toX, toY, scale }: MapView, { state }: VoyageFrame): boolean => {
  const kinds = state.cosmos?.phenomena ?? [];
  const reach = 4000;
  let isShown = false;

  context.save();
  context.lineWidth = 1.5;
  kinds.forEach((phenomenon) => {
    const x = toX(phenomenon.x);
    const y = toY(phenomenon.y);

    context.strokeStyle = hexWithAlpha(HAZARD, 0.7);
    context.fillStyle = hexWithAlpha(HAZARD, 0.08);

    if (phenomenon.kind === "nebula" || phenomenon.kind === "magnetar") {
      context.beginPath();
      context.arc(x, y, phenomenon.radius * scale, 0, TAU);
      context.fill();
      context.stroke();
    } else if (phenomenon.kind === "pulsar") {
      const angle = state.phenomena.pulsarAngle;

      context.beginPath();
      context.moveTo(x - Math.cos(angle) * reach, y - Math.sin(angle) * reach);
      context.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
      context.stroke();
    } else if (phenomenon.kind === "quasar") {
      const angle = Math.atan2(phenomenon.toY - phenomenon.y, phenomenon.toX - phenomenon.x);

      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
      context.stroke();
    } else if (phenomenon.kind === "supernova") {
      const blast = state.phenomena.supernova;

      context.strokeStyle = PULL;
      context.beginPath();
      context.arc(x, y, Math.max(6, (blast?.shock ?? 0) * scale), 0, TAU);
      context.stroke();
    } else if (phenomenon.kind === "wormholes") {
      context.setLineDash([2, 4]);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(toX(phenomenon.toX), toY(phenomenon.toY));
      context.stroke();
      context.setLineDash([]);
      [[x, y], [toX(phenomenon.toX), toY(phenomenon.toY)]].forEach(([mouthX, mouthY]) => {
        context.beginPath();
        context.arc(mouthX, mouthY, 5, 0, TAU);
        context.stroke();
      });
    } else {
      return;
    }

    isShown = true;
  });

  const burst = state.phenomena.burst;

  if (burst) {
    context.strokeStyle = PULL;
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(toX(burst.x) - Math.cos(burst.angle) * reach, toY(burst.y) - Math.sin(burst.angle) * reach);
    context.lineTo(toX(burst.x) + Math.cos(burst.angle) * reach, toY(burst.y) + Math.sin(burst.angle) * reach);
    context.stroke();
    context.setLineDash([]);
    isShown = true;
  }

  context.restore();

  return isShown;
};

// Rocks headed for worlds: a red mark on each with a dashed line to the world it will hit.
export const paintRocks = ({ context, toX, toY }: MapView, { state, world, alpha }: VoyageFrame): boolean => {
  let isShown = false;

  world.stores.impactor.entities.forEach((entity, index) => {
    const rock = world.stores.body.get(entity);
    const target = state.system.bodies.find((body) => body.id === world.stores.impactor.values[index].target);

    if (!rock) {
      return;
    }

    const x = toX(lerpX(rock, alpha));
    const y = toY(lerpY(rock, alpha));

    if (target && world.stores.impactor.values[index].isOnCourse) {
      context.strokeStyle = hexWithAlpha(PULL, 0.6);
      context.setLineDash([3, 4]);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(toX(target.x), toY(target.y));
      context.stroke();
      context.setLineDash([]);
    }

    context.fillStyle = PULL;
    context.beginPath();
    context.moveTo(x, y - 5);
    context.lineTo(x + 4.5, y + 3.5);
    context.lineTo(x - 4.5, y + 3.5);
    context.closePath();
    context.fill();
    isShown = true;
  });

  return isShown;
};

// Each black hole at its size, its mass beside it, and a dashed ring where its pull grows past the ship's engines:
// inside it, there is no burning away. The way on, when a mission wants it, wears a gold ring.
export const paintHoles = ({ context, toX, toY, scale, labels }: MapView, { state, world, config, theme }: VoyageFrame, isWayOn: boolean): boolean => {
  const thrust = config.ship.thrust;
  let isShown = false;

  world.stores.hole.entities.forEach((entity, index) => {
    const at = world.stores.body.get(entity);
    const hole = world.stores.hole.values[index];

    if (!at) {
      return;
    }

    const x = toX(at.x);
    const y = toY(at.y);
    const size = Math.max(5, hole.horizon * scale);
    const trap = (hole.horizon + Math.sqrt(hole.mu / thrust)) * scale;

    context.fillStyle = "#000000";
    context.strokeStyle = theme.disk;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, size, 0, TAU);
    context.fill();
    context.stroke();

    if (trap > size + 4) {
      context.strokeStyle = hexWithAlpha(PULL, 0.75);
      context.lineWidth = 1.5;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.arc(x, y, trap, 0, TAU);
      context.stroke();
      context.setLineDash([]);
      isShown = true;
    }

    if (isWayOn && state.phase === "universe") {
      context.strokeStyle = MISSION;
      context.lineWidth = 2;
      diamond(context, x, y, size + 7);
    }

    const label = labels.mapHoleMass;

    if (label) {
      context.fillStyle = hexWithAlpha(PULL, 0.95);
      context.fillText(fill(label, { mass: formatNumber(Math.round(hole.mass)) }), x, y + Math.max(size, trap) + 4);
    }
  });

  return isShown;
};

// Who would fight: hostile and territorial ships as red and amber dots, a boss larger, those a mission wants
// brought down ringed in gold.
export const paintHostiles = ({ context, toX, toY }: MapView, { state, world, alpha }: VoyageFrame, isWanted: boolean): boolean => {
  const factions = state.cosmos?.factions ?? [];
  let isShown = false;

  world.stores.alien.entities.forEach((entity, index) => {
    const alien = world.stores.alien.values[index];
    const faction = factions.find((living) => living.id === alien.faction);
    const body = world.stores.body.get(entity);

    if (!body || !faction || (faction.disposition !== "hostile" && faction.disposition !== "territorial")) {
      return;
    }

    const x = toX(lerpX(body, alpha));
    const y = toY(lerpY(body, alpha));
    const size = alien.role === "boss" ? 5 : 2.5;

    context.fillStyle = STANDING[faction.disposition];
    context.beginPath();
    context.arc(x, y, size, 0, TAU);
    context.fill();

    if (isWanted) {
      context.strokeStyle = MISSION;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, size + 3, 0, TAU);
      context.stroke();
    }

    isShown = true;
  });

  return isShown;
};

// Where the missions send the pilot: a gold diamond on each world to land on or reach, a gold ring at the distance
// from the Sun to come within, wrecks to salvage, and the edge where the black hole waits.
export const paintMissions = ({ context, toX, toY, scale, labels }: MapView, { state, world, alpha }: VoyageFrame, marks: MissionMarks): boolean => {
  const { system } = state;
  const isSolar = state.phase === "solar";
  let isShown = false;

  context.save();
  context.strokeStyle = MISSION;
  context.fillStyle = MISSION;
  context.lineWidth = 2;

  marks.bodies.forEach((id) => {
    const body = system.bodies.find((place) => place.id === id);

    if (!body || body.isShattered) {
      return;
    }

    const x = toX(body.x);
    const y = toY(body.y);
    const size = Math.max(5, body.radius * scale) + 6;

    diamond(context, x, y, size);

    if (labels.mapMission) {
      context.textBaseline = "bottom";
      context.fillText(labels.mapMission, x, y - size - 2);
      context.textBaseline = "top";
    }

    isShown = true;
  });

  if (isSolar) {
    marks.sunAu.forEach((au) => {
      context.setLineDash([2, 6]);
      context.beginPath();
      context.arc(toX(system.star.x), toY(system.star.y), radiusForAu(system.scale, au) * scale, 0, TAU);
      context.stroke();
      context.setLineDash([]);
      isShown = true;
    });

    if (marks.wayOn) {
      context.globalAlpha = 0.6;
      context.beginPath();
      context.arc(toX(system.star.x), toY(system.star.y), system.edge * scale, 0, TAU);
      context.stroke();
      context.globalAlpha = 1;
      isShown = true;
    }
  }

  if (marks.wrecks) {
    world.stores.wreck.entities.forEach((entity) => {
      const wreck = world.stores.body.get(entity);

      if (wreck) {
        diamond(context, toX(lerpX(wreck, alpha)), toY(lerpY(wreck, alpha)), 5);
        isShown = true;
      }
    });
  }

  context.restore();

  return isShown;
};

// The key, in the bottom right corner: only what the map shows now.
export const paintKey = ({ context, labels }: MapView, width: number, height: number, seen: MapSeen): void => {
  const rows: Array<[string, string | undefined]> = [
    [MISSION, seen.mission ? labels.mapKeyMission : undefined],
    [PULL, seen.pull ? labels.mapKeyPull : undefined],
    [STANDING.hostile, seen.hostile ? labels.mapKeyHostile : undefined],
    [PULL, seen.rock ? labels.mapKeyRock : undefined],
    [HAZARD, seen.hazard ? labels.mapKeyHazard : undefined],
  ];
  const shown = rows.filter((row): row is [string, string] => Boolean(row[1]));

  context.save();
  context.textAlign = "right";
  context.textBaseline = "middle";
  shown.forEach(([colour, text], index) => {
    const y = height - 16 - (shown.length - 1 - index) * 16;

    context.fillStyle = colour;
    context.fillRect(width - 18, y - 4, 8, 8);
    context.fillStyle = "rgba(196, 210, 255, 0.85)";
    context.fillText(text, width - 24, y);
  });
  context.restore();
};

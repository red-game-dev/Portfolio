import { TAU } from "@/packages/math/angles";

import { Surface } from "../Surface";

// How far in from the screen's edge something counts as in view, and where an arrow to it sits (CSS pixels).
export const EDGE_MARGIN = 46;

// Whether a point on the screen is well inside it.
export const isWellInView = (surface: Surface, x: number, y: number): boolean =>
  x > EDGE_MARGIN && x < surface.width - EDGE_MARGIN && y > EDGE_MARGIN && y < surface.height - EDGE_MARGIN;

// An arrow at the screen's edge pointing the way to something out of view, pulsing, with a dot at its tail and a label
// inside it: the way on to a black hole, a call for help.
export const drawEdgeArrow = (surface: Surface, x: number, y: number, colour: string, label: string, now: number): void => {
  const context = surface.context;
  const cx = surface.width / 2;
  const cy = surface.height / 2;
  const angle = Math.atan2(y - cy, x - cx);
  const edge = Math.min((surface.width / 2 - EDGE_MARGIN) / Math.abs(Math.cos(angle) || 1e-6), (surface.height / 2 - EDGE_MARGIN) / Math.abs(Math.sin(angle) || 1e-6));
  const ax = cx + Math.cos(angle) * edge;
  const ay = cy + Math.sin(angle) * edge;

  context.fillStyle = colour;
  surface.frame(ax, ay, angle);
  context.globalAlpha = 0.6 + Math.sin(now * 0.006) * 0.3;
  context.beginPath();
  context.arc(-2, 0, 7, 0, TAU);
  context.fill();
  context.fillStyle = "#05060c";
  context.beginPath();
  context.arc(-2, 0, 3.5, 0, TAU);
  context.fill();
  context.fillStyle = colour;
  context.beginPath();
  context.moveTo(16, 0);
  context.lineTo(7, -6);
  context.lineTo(7, 6);
  context.closePath();
  context.fill();
  surface.reset();
  context.font = "600 11px Roboto, Arial, sans-serif";
  context.textAlign = "center";
  context.globalAlpha = 0.9;
  context.fillText(label, ax - Math.cos(angle) * 22, ay - Math.sin(angle) * 22 + 4);
  context.globalAlpha = 1;
  context.textAlign = "start";
};

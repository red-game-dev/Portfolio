import { TAU } from "@/packages/math/angles";

import { ScreenBox, Surface } from "../Surface";

// How far in from the screen's edge something counts as in view, and where an arrow to it sits (CSS pixels).
export const EDGE_MARGIN = 46;
// How far an arrow keeps from a panel the page lays over the view, how close to the middle of the screen it may be
// moved in to clear one, and the steps it moves in by (CSS pixels).
const PANEL_GAP = 14;
const NEAREST = 60;
const STEP = 4;

// Whether a point on the screen lies under (or right by) a panel the page lays over the view.
export const isCovered = (boxes: readonly ScreenBox[], x: number, y: number): boolean =>
  boxes.some((box) => x > box.left - PANEL_GAP && x < box.right + PANEL_GAP && y > box.top - PANEL_GAP && y < box.bottom + PANEL_GAP);

// Whether a point on the screen is well inside it, and not under a panel.
export const isWellInView = (surface: Surface, x: number, y: number): boolean =>
  x > EDGE_MARGIN && x < surface.width - EDGE_MARGIN && y > EDGE_MARGIN && y < surface.height - EDGE_MARGIN && !isCovered(surface.covered, x, y);

// Where an arrow towards a point sits, and which way it points: on the line from the middle of the screen towards the
// point, `margin` in from the edge, then moved in along that line until it is clear of every panel over the view (the
// ability bar down a phone's side, the readout), so it is never drawn where it cannot be seen.
export const edgePoint = (width: number, height: number, boxes: readonly ScreenBox[], x: number, y: number, margin = EDGE_MARGIN) => {
  const cx = width / 2;
  const cy = height / 2;
  const angle = Math.atan2(y - cy, x - cx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let reach = Math.min((width / 2 - margin) / Math.abs(cos || 1e-6), (height / 2 - margin) / Math.abs(sin || 1e-6));

  while (reach > NEAREST && isCovered(boxes, cx + cos * reach, cy + sin * reach)) {
    reach -= STEP;
  }

  return { x: cx + cos * reach, y: cy + sin * reach, angle };
};

// An arrow at the screen's edge pointing the way to something out of view, pulsing, with a dot at its tail and a label
// inside it: the way on to a black hole, a call for help.
export const drawEdgeArrow = (surface: Surface, x: number, y: number, colour: string, label: string, now: number): void => {
  const context = surface.context;
  const { x: ax, y: ay, angle } = edgePoint(surface.width, surface.height, surface.covered, x, y);

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

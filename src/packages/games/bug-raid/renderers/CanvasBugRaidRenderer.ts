import { Canvas2DContext, CanvasRenderer, CanvasSurface, createDrawableSurface } from "@/packages/graphics/canvas";

import { BugRaidConfig, BugRaidTheme, DEFAULT_BUG_RAID_THEME } from "../config";
import { Bug, BugKind, BugRaidRenderer, BugRaidSize, BugRaidState } from "../domain/types";

interface BugSprite {
  surface: CanvasSurface;
  // Half the sprite's size in CSS pixels, to centre it on the bug.
  half: number;
}

const GRID_SPACING = 40;
const LEG_PAIRS = 3;
const BOB_PIXELS = 1.5;
const BOB_RATE = 0.012;
const DAMAGED_ALPHA = 0.55;

// Draws one bug, legs and antennae included, centred in a square of `size` device pixels.
const paintBug = (context: Canvas2DContext, size: number, radius: number, color: string) => {
  const centre = size / 2;

  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(1, radius * 0.16);
  context.lineCap = "round";
  context.beginPath();

  for (let pair = 0; pair < LEG_PAIRS; pair += 1) {
    const offset = (pair - 1) * radius * 0.55;

    context.moveTo(centre - radius * 0.5, centre + offset);
    context.lineTo(centre - radius * 1.15, centre + offset + radius * 0.3);
    context.moveTo(centre + radius * 0.5, centre + offset);
    context.lineTo(centre + radius * 1.15, centre + offset + radius * 0.3);
  }

  // Antennae point down, the way the bug walks.
  context.moveTo(centre - radius * 0.2, centre + radius * 0.85);
  context.lineTo(centre - radius * 0.55, centre + radius * 1.3);
  context.moveTo(centre + radius * 0.2, centre + radius * 0.85);
  context.lineTo(centre + radius * 0.55, centre + radius * 1.3);
  context.stroke();

  context.beginPath();
  context.ellipse(centre, centre - radius * 0.1, radius * 0.6, radius * 0.8, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(centre, centre + radius * 0.75, radius * 0.32, 0, Math.PI * 2);
  context.fill();

  // A seam down the shell.
  context.strokeStyle = "rgba(0, 0, 0, 0.45)";
  context.beginPath();
  context.moveTo(centre, centre - radius * 0.85);
  context.lineTo(centre, centre + radius * 0.6);
  context.stroke();
};

// Bugs are painted once per kind into sprites at device resolution, so a frame is a few drawImage calls,
// a handful of strokes and two lines of text, whatever the wave.
export class CanvasBugRaidRenderer extends CanvasRenderer<BugRaidState> implements BugRaidRenderer {
  private readonly theme: BugRaidTheme;
  private readonly config: BugRaidConfig;
  private readonly maxPixelRatio: number;
  private readonly productionLabel: string;
  private sprites = new Map<BugKind, BugSprite | null>();

  constructor(context: Canvas2DContext, config: BugRaidConfig, theme: BugRaidTheme = DEFAULT_BUG_RAID_THEME, productionLabel = "production") {
    super(context, { background: theme.background });
    this.config = config;
    this.theme = theme;
    this.maxPixelRatio = config.maxPixelRatio;
    this.productionLabel = productionLabel;
  }

  public resize({ width, height }: BugRaidSize, pixelRatio: number): void {
    const ratio = Math.min(pixelRatio, this.maxPixelRatio);

    if (ratio !== this.pixelRatio) {
      this.sprites.clear();
    }

    this.resizeSurface(width, height, ratio);
  }

  public draw(state: BugRaidState, now: number): void {
    this.clear();
    this.drawGrid();
    this.drawProduction();
    state.splats.forEach((splat) => this.drawSplat(splat.x, splat.y, splat.ageMs));
    state.bugs.forEach((bug) => this.drawBug(bug, now));

    if (state.cursor.isVisible && state.status === "playing") {
      this.drawCursor(state.cursor.x, state.cursor.y);
    }
  }

  private drawGrid(): void {
    const { context, size } = this;

    context.strokeStyle = this.theme.grid;
    context.lineWidth = 1;
    context.beginPath();

    for (let x = GRID_SPACING; x < size.width; x += GRID_SPACING) {
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, size.height);
    }

    for (let y = GRID_SPACING; y < size.height; y += GRID_SPACING) {
      context.moveTo(0, y + 0.5);
      context.lineTo(size.width, y + 0.5);
    }

    context.stroke();
  }

  private drawProduction(): void {
    const { context, size } = this;
    const top = size.height - this.config.productionHeight;

    context.globalAlpha = 0.12;
    context.fillStyle = this.theme.production;
    context.fillRect(0, top, size.width, this.config.productionHeight);
    context.globalAlpha = 1;
    context.strokeStyle = this.theme.production;
    context.setLineDash([6, 6]);
    context.beginPath();
    context.moveTo(0, top + 0.5);
    context.lineTo(size.width, top + 0.5);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = this.theme.text;
    context.font = "11px Roboto, sans-serif";
    context.textBaseline = "middle";
    context.fillText(this.productionLabel, 10, top + this.config.productionHeight / 2);
  }

  private drawBug(bug: Bug, now: number): void {
    const sprite = this.getSprite(bug.kind);

    if (!sprite) {
      return;
    }

    const isDamaged = bug.hitsLeft < this.config.kinds[bug.kind].hits;
    const bob = Math.sin(now * BOB_RATE + bug.phase) * BOB_PIXELS;

    this.context.globalAlpha = isDamaged ? DAMAGED_ALPHA : 1;
    this.context.drawImage(sprite.surface, bug.x - sprite.half + bob, bug.y - sprite.half, sprite.half * 2, sprite.half * 2);
    this.context.globalAlpha = 1;
  }

  private drawSplat(x: number, y: number, ageMs: number): void {
    const progress = ageMs / this.config.splatMs;

    this.context.globalAlpha = 1 - progress;
    this.context.strokeStyle = this.theme.splat;
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.arc(x, y, 8 + progress * 22, 0, Math.PI * 2);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  private drawCursor(x: number, y: number): void {
    const { context } = this;

    context.strokeStyle = this.theme.cursor;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(x, y, 14, 0, Math.PI * 2);
    context.moveTo(x - 22, y);
    context.lineTo(x - 8, y);
    context.moveTo(x + 8, y);
    context.lineTo(x + 22, y);
    context.moveTo(x, y - 22);
    context.lineTo(x, y - 8);
    context.moveTo(x, y + 8);
    context.lineTo(x, y + 22);
    context.stroke();
  }

  private getSprite(kind: BugKind): BugSprite | null {
    if (!this.sprites.has(kind)) {
      this.sprites.set(kind, this.renderSprite(kind));
    }

    return this.sprites.get(kind) ?? null;
  }

  private renderSprite(kind: BugKind): BugSprite | null {
    const { radius } = this.config.kinds[kind];
    // Legs and antennae reach past the body, so the sprite is wider than the hit circle.
    const half = radius * 1.5;
    const size = Math.ceil(half * 2 * this.pixelRatio);
    const drawable = createDrawableSurface(size, size);

    if (!drawable) {
      return null;
    }

    paintBug(drawable.context, size, radius * this.pixelRatio, this.theme.bugs[kind]);

    return { surface: drawable.surface, half };
  }
}

import { Canvas2DContext } from "@/packages/graphics/canvas";
import { Rgb, rgba } from "@/packages/graphics/colour";
import { clamp } from "@/packages/math/clamp";
import { lerp, smoothstep } from "@/packages/math/easing";
import { RandomSource } from "@/packages/math/random";

import { Scene, SceneSize } from "../domain/types";

export interface DevopsSceneOptions {
  // The racks and their cables.
  rack: Rgb;
  // The core switch every cable runs to.
  core: Rgb;
  // The universes the racks run, one to a rack in turn, and the colours they travel in.
  universes: Rgb[];
  intensity: number;
}

interface Point {
  x: number;
  y: number;
}

interface Rack {
  x: number;
  width: number;
  colour: Rgb;
  // Where in the build it rises, as a share of it.
  delay: number;
  // Each unit's light: its own pace and starting point, so they never blink together.
  lights: Array<{ period: number; phase: number }>;
  // A rebuild under way: how far through it (ms), or null.
  rebuild: number | null;
}

// A universe on its way from one rack to another: up its cable to the core, then down the other's (0 to 2).
interface Transfer {
  from: number;
  to: number;
  at: number;
  colour: Rgb;
}

// A container lifted off one rack and carried along the gantry to another (0 to 1).
interface Shipment {
  from: number;
  to: number;
  at: number;
  colour: Rgb;
}

// From bare metal to every rack lit, and how long a gap in the frames means the reader left and came back.
const BUILD_MS = 2800;
const AWAY_MS = 1500;
const UNITS = 14;
const TRANSFER_EVERY_MS = 380;
const TRANSFER_MS = 1700;
const SHIP_EVERY_MS = 3600;
const SHIP_MS = 2600;
const REBUILD_EVERY_MS = 24000;
const REBUILD_MS = 2600;
const FLASH_MS = 520;

const along = (from: Point, control: Point, to: Point, t: number): Point => ({
  x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * to.x,
  y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * to.y,
});

const eased = (value: number) => smoothstep(0, 1, clamp(value, 0, 1));

// The DevOps universe: a data centre that builds itself from bare metal as the reader arrives (the racks rise and are
// cabled to the core, their lights boot from the bottom up), every rack running one of the other universes in its
// colour. Universes move between the racks all the time: transfers along the cables through the core, the rack they
// reach flashing as the deploy lands, and now and then a container carried along the gantry. Every so often one rack
// is torn down and built again, as ours were, many times. Strokes and fills only; with no frames run (reduced
// motion) it is drawn built.
export class DevopsScene implements Scene {
  public readonly id = "devops";
  private readonly random: RandomSource;
  private readonly options: DevopsSceneOptions;
  private racks: Rack[] = [];
  private transfers: Transfer[] = [];
  private shipments: Shipment[] = [];
  private flashes = new Map<number, { colour: Rgb; age: number }>();
  private core: Point = { x: 0, y: 0 };
  private bottom = 0;
  private rackHeight = 0;
  private gantry = 0;
  private height = 0;
  private age = 0;
  private lastNow: number | null = null;
  private sinceTransfer = 0;
  private sinceShip = 0;
  private sinceRebuild = 0;

  constructor(random: RandomSource, options: DevopsSceneOptions) {
    this.random = random;
    this.options = options;
  }

  public resize({ width, height }: SceneSize): void {
    const count = clamp(Math.round(width / 160), 4, 11);
    const step = width / count;
    const rackWidth = clamp(step * 0.42, 34, 72);

    this.height = height;
    this.bottom = height * 0.94;
    this.rackHeight = height * 0.4;
    this.gantry = this.bottom - this.rackHeight - height * 0.07;
    this.core = { x: width / 2, y: height * 0.16 };
    this.racks = Array.from({ length: count }, (_, index) => ({
      x: step * index + (step - rackWidth) / 2,
      width: rackWidth,
      colour: this.options.universes[index % this.options.universes.length] ?? this.options.rack,
      delay: (index / count) * 0.45,
      lights: Array.from({ length: UNITS }, () => ({ period: 600 + this.random() * 2400, phase: this.random() * Math.PI * 2 })),
      rebuild: null,
    }));
    this.transfers = [];
    this.shipments = [];
    this.flashes.clear();
  }

  public update(deltaMs: number, now: number): void {
    if (this.lastNow === null || now - this.lastNow > AWAY_MS) {
      this.age = 0;
      this.transfers = [];
      this.shipments = [];
    }

    this.lastNow = now;
    this.age += deltaMs;
    this.flashes.forEach((flash, rack) => {
      flash.age += deltaMs;

      if (flash.age >= FLASH_MS) {
        this.flashes.delete(rack);
      }
    });
    this.racks.forEach((rack) => {
      if (rack.rebuild !== null) {
        rack.rebuild = rack.rebuild + deltaMs >= REBUILD_MS ? null : rack.rebuild + deltaMs;
      }
    });

    if (this.age < BUILD_MS || this.racks.length < 2) {
      return;
    }

    this.moveTransfers(deltaMs);
    this.moveShipments(deltaMs);
    this.sinceRebuild += deltaMs;

    if (this.sinceRebuild >= REBUILD_EVERY_MS) {
      this.sinceRebuild = 0;
      this.racks[Math.floor(this.random() * this.racks.length)].rebuild = 0;
    }
  }

  public draw(context: Canvas2DContext, alpha: number, now = 0): void {
    const strength = alpha * this.options.intensity;
    // Never stepped (reduced motion, or the first still frame): drawn as built.
    const built = this.lastNow === null ? 1 : clamp(this.age / BUILD_MS, 0, 1);

    if (strength <= 0.001 || this.racks.length === 0) {
      return;
    }

    this.drawCables(context, strength, built);
    this.drawGantry(context, strength, built);
    this.racks.forEach((rack, index) => this.drawRack(context, rack, index, strength, built, now));
    this.drawCore(context, strength, built);
    this.drawTransfers(context, strength);
    this.drawShipments(context, strength);
  }

  private moveTransfers(deltaMs: number): void {
    this.sinceTransfer += deltaMs;

    if (this.sinceTransfer >= TRANSFER_EVERY_MS) {
      this.sinceTransfer = 0;

      const from = Math.floor(this.random() * this.racks.length);
      const to = (from + 1 + Math.floor(this.random() * (this.racks.length - 1))) % this.racks.length;

      this.transfers.push({ from, to, at: 0, colour: this.racks[from].colour });
    }

    this.transfers.forEach((transfer) => {
      transfer.at += (deltaMs / TRANSFER_MS) * 2;

      if (transfer.at >= 2) {
        this.flashes.set(transfer.to, { colour: transfer.colour, age: 0 });
      }
    });
    this.transfers = this.transfers.filter((transfer) => transfer.at < 2);
  }

  private moveShipments(deltaMs: number): void {
    this.sinceShip += deltaMs;

    if (this.sinceShip >= SHIP_EVERY_MS) {
      this.sinceShip = 0;

      const from = Math.floor(this.random() * this.racks.length);
      const to = (from + 1 + Math.floor(this.random() * (this.racks.length - 1))) % this.racks.length;

      this.shipments.push({ from, to, at: 0, colour: this.racks[from].colour });
    }

    this.shipments.forEach((shipment) => {
      shipment.at += deltaMs / SHIP_MS;

      if (shipment.at >= 1) {
        this.flashes.set(shipment.to, { colour: shipment.colour, age: 0 });
      }
    });
    this.shipments = this.shipments.filter((shipment) => shipment.at < 1);
  }

  // How far up a rack stands (0 down, 1 in place), through the build and any rebuild of its own.
  private standing(rack: Rack, built: number): number {
    const rising = eased((built - rack.delay) / 0.4);

    if (rack.rebuild === null) {
      return rising;
    }

    const share = rack.rebuild / REBUILD_MS;

    return Math.min(rising, share < 0.4 ? 1 - eased(share / 0.4) : eased((share - 0.55) / 0.45));
  }

  private top(rack: Rack, built: number): number {
    return this.bottom - this.rackHeight + (1 - this.standing(rack, built)) * (this.height - this.bottom + this.rackHeight + 20);
  }

  private socket(rack: Rack, built: number): Point {
    return { x: rack.x + rack.width / 2, y: this.top(rack, built) };
  }

  private control(from: Point): Point {
    return { x: (from.x + this.core.x) / 2, y: Math.min(from.y, this.core.y) - this.height * 0.04 };
  }

  private drawRack(context: Canvas2DContext, rack: Rack, index: number, strength: number, built: number, now: number): void {
    const standing = this.standing(rack, built);
    const top = this.top(rack, built);
    const unit = this.rackHeight / UNITS;
    // The lights boot from the bottom up once the rack stands.
    const booted = Math.floor(eased((standing - 0.65) / 0.35) * UNITS);
    const flash = this.flashes.get(index);

    if (top >= this.height) {
      return;
    }

    context.lineWidth = 1;
    context.strokeStyle = rgba(this.options.rack, 0.38 * strength);
    context.strokeRect(rack.x, top, rack.width, this.rackHeight);
    context.strokeStyle = rgba(this.options.rack, 0.1 * strength);
    context.beginPath();

    for (let slot = 1; slot < UNITS; slot += 1) {
      context.moveTo(rack.x + 2, top + slot * unit);
      context.lineTo(rack.x + rack.width - 2, top + slot * unit);
    }

    context.stroke();

    for (let slot = 0; slot < booted; slot += 1) {
      const light = rack.lights[slot];
      const glow = 0.45 + 0.55 * Math.max(0, Math.sin(now / light.period + light.phase));
      const y = top + (UNITS - 1 - slot) * unit + unit / 2 - 1;

      context.fillStyle = rgba(rack.colour, 0.6 * glow * strength);
      context.fillRect(rack.x + rack.width * 0.14, y, 3, 2);
      context.fillStyle = rgba(rack.colour, 0.25 * strength);
      context.fillRect(rack.x + rack.width * 0.3, y, rack.width * 0.5, 2);
    }

    if (flash) {
      const fade = 1 - flash.age / FLASH_MS;

      context.fillStyle = rgba(flash.colour, 0.5 * fade * strength);
      context.fillRect(rack.x + 1, top + 1, rack.width - 2, unit * 2);
    }
  }

  private drawCables(context: Canvas2DContext, strength: number, built: number): void {
    const cabled = eased((built - 0.55) / 0.3);

    if (cabled <= 0) {
      return;
    }

    context.lineWidth = 1;
    context.strokeStyle = rgba(this.options.rack, 0.16 * cabled * strength);
    context.beginPath();
    this.racks.forEach((rack) => {
      const from = this.socket(rack, built);
      const control = this.control(from);

      context.moveTo(from.x, from.y);
      context.quadraticCurveTo(control.x, control.y, this.core.x, this.core.y);
    });
    context.stroke();
  }

  private drawGantry(context: Canvas2DContext, strength: number, built: number): void {
    const width = this.racks[this.racks.length - 1].x + this.racks[this.racks.length - 1].width - this.racks[0].x;
    const laid = eased((built - 0.5) / 0.35);

    context.strokeStyle = rgba(this.options.rack, 0.12 * strength);
    context.beginPath();
    context.moveTo(this.racks[0].x, this.gantry);
    context.lineTo(this.racks[0].x + width * laid, this.gantry);
    context.stroke();
  }

  private drawCore(context: Canvas2DContext, strength: number, built: number): void {
    const lit = eased((built - 0.7) / 0.3);
    const size = { width: 64, height: 22 };

    context.strokeStyle = rgba(this.options.core, 0.5 * strength);
    context.strokeRect(this.core.x - size.width / 2, this.core.y - size.height / 2, size.width, size.height);
    context.fillStyle = rgba(this.options.core, 0.18 * lit * strength);
    context.fillRect(this.core.x - size.width / 2, this.core.y - size.height / 2, size.width, size.height);
  }

  private drawTransfers(context: Canvas2DContext, strength: number): void {
    this.transfers.forEach((transfer) => {
      const isUp = transfer.at < 1;
      const rack = this.racks[isUp ? transfer.from : transfer.to];
      const from = this.socket(rack, 1);
      const control = this.control(from);
      const at = isUp ? along(from, control, this.core, transfer.at) : along(from, control, this.core, 2 - transfer.at);

      context.fillStyle = rgba(transfer.colour, 0.85 * strength);
      context.fillRect(at.x - 2, at.y - 2, 4, 4);
      context.fillStyle = rgba(transfer.colour, 0.2 * strength);
      context.fillRect(at.x - 5, at.y - 5, 10, 10);
    });
  }

  private drawShipments(context: Canvas2DContext, strength: number): void {
    this.shipments.forEach((shipment) => {
      const from = this.socket(this.racks[shipment.from], 1);
      const to = this.socket(this.racks[shipment.to], 1);
      // Lifted to the gantry, carried along it, then lowered into the other rack.
      const lift = eased(shipment.at / 0.2);
      const carry = eased((shipment.at - 0.2) / 0.6);
      const lower = eased((shipment.at - 0.8) / 0.2);
      const x = lerp(from.x, to.x, carry);
      const y = shipment.at < 0.8 ? lerp(from.y, this.gantry, lift) : lerp(this.gantry, to.y, lower);

      context.fillStyle = rgba([10, 10, 10], 0.8 * strength);
      context.fillRect(x - 9, y - 6, 18, 12);
      context.strokeStyle = rgba(this.options.rack, 0.5 * strength);
      context.strokeRect(x - 9, y - 6, 18, 12);
      context.fillStyle = rgba(shipment.colour, 0.85 * strength);
      context.fillRect(x - 9, y - 6, 18, 3);
    });
  }
}

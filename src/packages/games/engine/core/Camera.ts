import { Bounds, Viewport } from "../domain/types";

export interface CameraOptions {
  // Screen pixels per world unit at zoom 1.
  pixelsPerUnit: number;
  // How quickly it catches up with its target: higher is tighter.
  stiffness?: number;
  // The largest shake, in pixels, at full trauma.
  maxShake?: number;
}

// A camera on a spring: it follows a target with a critically damped spring (no overshoot, no lag that grows
// with speed), eases its zoom, and shakes with "trauma" that decays, the offset growing with trauma squared so
// small knocks stay small. Converts between world units and screen pixels and answers what is on screen.
export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1;
  private viewport: Viewport = { width: 0, height: 0 };
  private pixelsPerUnit: number;
  private readonly stiffness: number;
  private readonly maxShake: number;
  private vx = 0;
  private vy = 0;
  private trauma = 0;
  private shakeX = 0;
  private shakeY = 0;
  private time = 0;

  constructor({ pixelsPerUnit, stiffness = 6, maxShake = 14 }: CameraOptions) {
    this.pixelsPerUnit = pixelsPerUnit;
    this.stiffness = stiffness;
    this.maxShake = maxShake;
  }

  public get scale(): number {
    return this.pixelsPerUnit * this.zoom;
  }

  public get size(): Viewport {
    return this.viewport;
  }

  public resize(viewport: Viewport, pixelsPerUnit: number): void {
    this.viewport = viewport;
    this.pixelsPerUnit = pixelsPerUnit;
  }

  public jumpTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  public follow(targetX: number, targetY: number, dt: number): void {
    const omega = this.stiffness;
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    const ax = -omega * omega * dx - 2 * omega * this.vx;
    const ay = -omega * omega * dy - 2 * omega * this.vy;

    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  public easeZoom(target: number, dt: number, rate = 2.5): void {
    this.zoom += (target - this.zoom) * Math.min(1, dt * rate);
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  // Advances the shake; call once a frame.
  public tick(dt: number): void {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.4);

    const shake = this.trauma * this.trauma * this.maxShake;

    this.shakeX = shake * Math.sin(this.time * 47.3) * Math.cos(this.time * 23.1);
    this.shakeY = shake * Math.sin(this.time * 39.7 + 1.3) * Math.cos(this.time * 17.9);
  }

  public toScreenX(x: number): number {
    return (x - this.x) * this.scale + this.viewport.width / 2 + this.shakeX;
  }

  public toScreenY(y: number): number {
    return (y - this.y) * this.scale + this.viewport.height / 2 + this.shakeY;
  }

  public toWorldX(screenX: number): number {
    return (screenX - this.viewport.width / 2 - this.shakeX) / this.scale + this.x;
  }

  public toWorldY(screenY: number): number {
    return (screenY - this.viewport.height / 2 - this.shakeY) / this.scale + this.y;
  }

  // What the camera sees, in world units, grown by `margin` units on every side.
  public bounds(margin = 0): Bounds {
    const halfWidth = this.viewport.width / 2 / this.scale + margin;
    const halfHeight = this.viewport.height / 2 / this.scale + margin;

    return { left: this.x - halfWidth, top: this.y - halfHeight, right: this.x + halfWidth, bottom: this.y + halfHeight };
  }

  public sees(x: number, y: number, radius: number): boolean {
    const halfWidth = this.viewport.width / 2 / this.scale + radius;
    const halfHeight = this.viewport.height / 2 / this.scale + radius;

    return Math.abs(x - this.x) <= halfWidth && Math.abs(y - this.y) <= halfHeight;
  }
}

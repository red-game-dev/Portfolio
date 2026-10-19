/* eslint-disable max-classes-per-file -- the renderer, the globes and the kit they make up are one family of doubles */
import { Camera } from "@/packages/games/engine";
import { DEFAULT_VOYAGE_THEME, VoyageRenderer, VoyageSimulation } from "@/packages/games/voyage";
import { VoyageFrame } from "@/packages/games/voyage/renderers/frame";
import { RenderKit } from "@/packages/games/voyage/renderers/layers/kit";
import { ParticleSystem } from "@/packages/games/voyage/renderers/ParticleSystem";
import { Surface } from "@/packages/games/voyage/renderers/Surface";
import { SurfaceCache } from "@/packages/games/voyage/renderers/SurfaceCache";
import { GlobeDraw, GlobeRenderer } from "@/packages/graphics/globe";

import { FakeContext2D } from "../../../../fixtures/canvas";
import { defaults } from "./simulation";

// A renderer that draws nothing, for a host run headless.
export class SilentRenderer implements VoyageRenderer {
  public readonly surface = null;

  public resize(): void {
    return undefined;
  }

  public draw(): void {
    return undefined;
  }

  public lenses() {
    return [];
  }

  public attach() {
    return () => undefined;
  }

  public reset(): void {
    return undefined;
  }

  public setTexture(): void {
    return undefined;
  }

  public setMap(): void {
    return undefined;
  }

  public setQuality(): void {
    return undefined;
  }

  public setGhost(): void {
    return undefined;
  }

  public setCovered(): void {
    return undefined;
  }

  public setPhoto(): void {
    return undefined;
  }

  public radarAt(): boolean {
    return false;
  }

  public setHome(): void {
    return undefined;
  }

  public setMissions(): void {
    return undefined;
  }

  public setLook(): void {
    return undefined;
  }

  public setReducedMotion(): void {
    return undefined;
  }

  public dispose(): void {
    return undefined;
  }
}

// Globes that draw nothing and keep each globe they were asked for, on the GPU or not.
export class RecordingGlobes implements GlobeRenderer {
  public readonly isGpu: boolean;
  public readonly available = true;
  public readonly draws: GlobeDraw[] = [];

  constructor(isGpu: boolean) {
    this.isGpu = isGpu;
  }

  public resize(): void {
    return undefined;
  }

  public setTexture(): void {
    return undefined;
  }

  public hasTexture(): boolean {
    return false;
  }

  public drawGlobe(_target: unknown, draw: GlobeDraw): void {
    this.draws.push(draw);
  }

  public drawStar(): void {
    return undefined;
  }

  public setDetail(): void {
    return undefined;
  }

  public dispose(): void {
    return undefined;
  }
}

// What the layers share, on surfaces that draw nothing, with these globes.
export const renderKitWith = (globes: GlobeRenderer) =>
  new RenderKit(new Surface(new FakeContext2D()), new Surface(new FakeContext2D()), new SurfaceCache(), new ParticleSystem(), DEFAULT_VOYAGE_THEME, globes, {});

// A frame of the run as it stands, at a moment on the frame clock.
export const frameOf = (simulation: VoyageSimulation, now: number): VoyageFrame => ({
  state: simulation.state,
  world: simulation.world,
  camera: new Camera({ pixelsPerUnit: 400 }),
  config: defaults,
  theme: DEFAULT_VOYAGE_THEME,
  now,
  dt: 0,
  alpha: 1,
  universe: null,
  isLensed: false,
});
